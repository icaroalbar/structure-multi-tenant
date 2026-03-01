import { Transport, type RmqOptions } from '@nestjs/microservices';

import { RABBITMQ_TOPOLOGY } from './rabbitmq.constants';

export function createWorkerRmqOptions(): RmqOptions {
  return {
    transport: Transport.RMQ,
    options: {
      urls: [RABBITMQ_TOPOLOGY.url],
      queue: RABBITMQ_TOPOLOGY.queue,
      noAck: false,
      prefetchCount: 1,
      queueOptions: {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': RABBITMQ_TOPOLOGY.deadLetterExchange,
          'x-dead-letter-routing-key': RABBITMQ_TOPOLOGY.deadLetterRoutingKey
        }
      }
    }
  };
}
