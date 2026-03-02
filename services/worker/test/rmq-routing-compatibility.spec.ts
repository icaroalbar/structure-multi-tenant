import { ServerRMQ } from '@nestjs/microservices';

import {
  createNestRmqEventEnvelope,
  type BillingJobMessage
} from '../../shared/contracts/billing-job.contract';
import { RABBITMQ_TOPOLOGY } from '../src/infrastructure/messaging/rabbitmq.constants';
import { createWorkerRmqOptions } from '../src/infrastructure/messaging/rabbitmq-options.factory';

describe('Nest RMQ routing compatibility', () => {
  it('dispatches the handler when message uses pattern/data envelope', async () => {
    const options = createWorkerRmqOptions().options;
    if (!options) {
      throw new Error('Worker RMQ options are required for this compatibility test');
    }
    const server = new ServerRMQ(options);
    const handler = jest.fn().mockResolvedValue(undefined);

    server.addHandler(RABBITMQ_TOPOLOGY.routingKey, handler, true);

    const payload: BillingJobMessage = {
      tenantId: 'tenant-a',
      jobId: 'job-1',
      customerId: 'customer-1',
      amount: 99,
      issuedAt: '2026-03-01T00:00:00.000Z'
    };

    const message = {
      content: Buffer.from(
        JSON.stringify(createNestRmqEventEnvelope(RABBITMQ_TOPOLOGY.routingKey, payload))
      ),
      properties: {}
    };

    await server.handleMessage(message, { nack: jest.fn() });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(payload, expect.any(Object));
  });
});
