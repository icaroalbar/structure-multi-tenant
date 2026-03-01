import type { Channel, ChannelModel } from 'amqplib';
import { connect } from 'amqplib';

import { RABBITMQ_TOPOLOGY } from '../src/infrastructure/messaging/rabbitmq.constants';
import { RabbitMqTopologyService } from '../src/infrastructure/messaging/rabbitmq-topology.service';

jest.mock('amqplib', () => ({
  connect: jest.fn()
}));

describe('RabbitMqTopologyService', () => {
  const connectMock = connect as jest.MockedFunction<typeof connect>;

  const channel = {
    assertExchange: jest.fn().mockResolvedValue(undefined),
    assertQueue: jest.fn().mockResolvedValue(undefined),
    bindQueue: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined)
  } as unknown as Channel;

  const connection = {
    createChannel: jest.fn().mockResolvedValue(channel),
    close: jest.fn().mockResolvedValue(undefined)
  } as unknown as ChannelModel;

  let topologyService: RabbitMqTopologyService;

  beforeEach(() => {
    jest.clearAllMocks();
    connectMock.mockResolvedValue(connection);
    topologyService = new RabbitMqTopologyService();
  });

  it('configures exchange, queue and DLQ topology on module init', async () => {
    await topologyService.onModuleInit();

    expect(connectMock).toHaveBeenCalledWith(RABBITMQ_TOPOLOGY.url);
    expect(connection.createChannel).toHaveBeenCalled();

    expect(channel.assertExchange).toHaveBeenCalledWith(RABBITMQ_TOPOLOGY.exchange, 'direct', {
      durable: true
    });
    expect(channel.assertExchange).toHaveBeenCalledWith(
      RABBITMQ_TOPOLOGY.deadLetterExchange,
      'direct',
      {
        durable: true
      }
    );

    expect(channel.assertQueue).toHaveBeenCalledWith(RABBITMQ_TOPOLOGY.queue, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': RABBITMQ_TOPOLOGY.deadLetterExchange,
        'x-dead-letter-routing-key': RABBITMQ_TOPOLOGY.deadLetterRoutingKey
      }
    });
    expect(channel.assertQueue).toHaveBeenCalledWith(RABBITMQ_TOPOLOGY.deadLetterQueue, {
      durable: true
    });

    expect(channel.bindQueue).toHaveBeenCalledWith(
      RABBITMQ_TOPOLOGY.queue,
      RABBITMQ_TOPOLOGY.exchange,
      RABBITMQ_TOPOLOGY.routingKey
    );
    expect(channel.bindQueue).toHaveBeenCalledWith(
      RABBITMQ_TOPOLOGY.deadLetterQueue,
      RABBITMQ_TOPOLOGY.deadLetterExchange,
      RABBITMQ_TOPOLOGY.deadLetterRoutingKey
    );
  });

  it('propagates connection errors during initialization', async () => {
    connectMock.mockRejectedValueOnce(new Error('RabbitMQ unavailable'));

    await expect(topologyService.onModuleInit()).rejects.toThrow('RabbitMQ unavailable');
  });

  it('closes channel and connection on module destroy', async () => {
    await topologyService.onModuleInit();

    await topologyService.onModuleDestroy();

    expect(channel.close).toHaveBeenCalledTimes(1);
    expect(connection.close).toHaveBeenCalledTimes(1);
  });

  it('does not fail on destroy when not initialized', async () => {
    await expect(topologyService.onModuleDestroy()).resolves.toBeUndefined();
  });
});
