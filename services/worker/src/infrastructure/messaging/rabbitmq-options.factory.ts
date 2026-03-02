import { Transport, type RmqOptions } from '@nestjs/microservices';

import { createPrimaryQueueArguments } from '../../../../shared/contracts/rabbitmq-topology.contract';
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
        arguments: createPrimaryQueueArguments(RABBITMQ_TOPOLOGY)
      }
    }
  };
}
