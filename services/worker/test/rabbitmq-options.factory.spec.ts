import { Transport } from '@nestjs/microservices';

import { RABBITMQ_TOPOLOGY } from '../src/infrastructure/messaging/rabbitmq.constants';
import { createWorkerRmqOptions } from '../src/infrastructure/messaging/rabbitmq-options.factory';

describe('createWorkerRmqOptions', () => {
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
});
