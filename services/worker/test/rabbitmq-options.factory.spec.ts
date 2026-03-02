import { Transport } from '@nestjs/microservices';

import { RABBITMQ_TOPOLOGY } from '../src/infrastructure/messaging/rabbitmq.constants';
import { createWorkerRmqOptions } from '../src/infrastructure/messaging/rabbitmq-options.factory';

describe('createWorkerRmqOptions', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  it('configures queue with dead-letter exchange and key', () => {
    const options = createWorkerRmqOptions();

    expect(options.transport).toBe(Transport.RMQ);
    expect(options.options).toEqual(
      expect.objectContaining({
        queue: RABBITMQ_TOPOLOGY.queue,
        noAck: false,
        queueOptions: expect.objectContaining({
          arguments: {
            'x-dead-letter-exchange': RABBITMQ_TOPOLOGY.deadLetterExchange,
            'x-dead-letter-routing-key': RABBITMQ_TOPOLOGY.deadLetterRoutingKey
          }
        })
      })
    );
  });

  it('uses custom dead-letter routing key from env in queue arguments', async () => {
    process.env = {
      ...originalEnv,
      RABBITMQ_DLX: 'billing.dlx.custom',
      RABBITMQ_DLQ: 'billing.jobs.custom.dlq',
      RABBITMQ_DLQ_ROUTING_KEY: 'billing.jobs.custom.dlq.route'
    };
    jest.resetModules();

    const { createWorkerRmqOptions: createCustomWorkerRmqOptions } = require(
      '../src/infrastructure/messaging/rabbitmq-options.factory'
    ) as typeof import('../src/infrastructure/messaging/rabbitmq-options.factory');

    const options = createCustomWorkerRmqOptions();
    expect(options.options?.queueOptions).toEqual(
      expect.objectContaining({
        arguments: {
          'x-dead-letter-exchange': 'billing.dlx.custom',
          'x-dead-letter-routing-key': 'billing.jobs.custom.dlq.route'
        }
      })
    );
  });
});
