import type { Channel, ChannelModel } from 'amqplib';
import { connect } from 'amqplib';

import { createNestRmqEventEnvelope } from '../../shared/contracts/billing-job.contract';
import { injectTraceContextToHeaders } from '../../shared/observability/rmq-trace-context';
import { RabbitMqBillingPublisher } from '../src/modules/billing/infrastructure/messaging/rabbitmq-billing.publisher';

jest.mock('amqplib', () => ({
  connect: jest.fn()
}));
jest.mock('../../shared/observability/rmq-trace-context', () => ({
  injectTraceContextToHeaders: jest.fn()
}));

describe('RabbitMqBillingPublisher', () => {
  const originalEnv = process.env;
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
    process.env = originalEnv;
    jest.clearAllMocks();
    connectMock.mockResolvedValue(connection);
    (injectTraceContextToHeaders as jest.Mock).mockReturnValue({
      traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'
    });
  });

  afterAll(() => {
    process.env = originalEnv;
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
        timestamp: expect.any(Number),
        headers: expect.objectContaining({
          traceparent: expect.any(String)
        })
      })
    );
    expect(injectTraceContextToHeaders).toHaveBeenCalled();

    const body = (channel.publish as jest.Mock).mock.calls[0][2] as Buffer;

    expect(JSON.parse(body.toString())).toEqual(
      createNestRmqEventEnvelope('billing.job.created', message)
    );
  });

  it('respects explicit RABBITMQ_DLQ_ROUTING_KEY during topology declaration', async () => {
    process.env = {
      ...originalEnv,
      RABBITMQ_QUEUE: 'billing.jobs.custom',
      RABBITMQ_DLX: 'billing.dlx.custom',
      RABBITMQ_DLQ: 'billing.jobs.custom.dlq',
      RABBITMQ_DLQ_ROUTING_KEY: 'billing.jobs.custom.dlq.route'
    };
    const publisher = new RabbitMqBillingPublisher();
    const message = {
      tenantId: 'tenant-a',
      jobId: 'job-2',
      customerId: 'customer-2',
      amount: 200,
      issuedAt: '2026-03-01T00:00:00.000Z'
    };

    await publisher.publish(message);

    expect(channel.assertQueue).toHaveBeenCalledWith('billing.jobs.custom', {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'billing.dlx.custom',
        'x-dead-letter-routing-key': 'billing.jobs.custom.dlq.route'
      }
    });
    expect(channel.bindQueue).toHaveBeenCalledWith(
      'billing.jobs.custom.dlq',
      'billing.dlx.custom',
      'billing.jobs.custom.dlq.route'
    );
  });
});
