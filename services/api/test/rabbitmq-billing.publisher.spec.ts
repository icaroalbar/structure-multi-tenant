import type { Channel, ChannelModel } from 'amqplib';
import { connect } from 'amqplib';

import { createNestRmqEventEnvelope } from '../../shared/contracts/billing-job.contract';
import { RabbitMqBillingPublisher } from '../src/modules/billing/infrastructure/messaging/rabbitmq-billing.publisher';

jest.mock('amqplib', () => ({
  connect: jest.fn()
}));

describe('RabbitMqBillingPublisher', () => {
  const connectMock = connect as jest.MockedFunction<typeof connect>;

  const channel = {
    assertExchange: jest.fn().mockResolvedValue(undefined),
    assertQueue: jest.fn().mockResolvedValue(undefined),
    bindQueue: jest.fn().mockResolvedValue(undefined),
    publish: jest.fn().mockReturnValue(true),
    close: jest.fn().mockResolvedValue(undefined)
  } as unknown as Channel;

  const connection = {
    createChannel: jest.fn().mockResolvedValue(channel),
    close: jest.fn().mockResolvedValue(undefined)
  } as unknown as ChannelModel;

  beforeEach(() => {
    jest.clearAllMocks();
    connectMock.mockResolvedValue(connection);
  });

  it('publishes billing job in Nest RMQ pattern/data envelope', async () => {
    const publisher = new RabbitMqBillingPublisher();
    const message = {
      tenantId: 'tenant-a',
      jobId: 'job-1',
      customerId: 'customer-1',
      amount: 100,
      issuedAt: '2026-03-01T00:00:00.000Z'
    };

    await publisher.publish(message);

    expect(channel.publish).toHaveBeenCalledTimes(1);
    expect(channel.publish).toHaveBeenCalledWith(
      'billing.events',
      'billing.job.created',
      expect.any(Buffer),
      expect.objectContaining({
        persistent: true,
        contentType: 'application/json',
        messageId: message.jobId,
        timestamp: expect.any(Number)
      })
    );

    const body = (channel.publish as jest.Mock).mock.calls[0][2] as Buffer;

    expect(JSON.parse(body.toString())).toEqual(
      createNestRmqEventEnvelope('billing.job.created', message)
    );
  });
});
