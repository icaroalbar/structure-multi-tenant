import {
  createPrimaryQueueArguments,
  declareRabbitMqTopology,
  resolveRabbitMqTopology
} from './rabbitmq-topology.contract';

describe('rabbitmq-topology.contract', () => {
  it('prioritizes RABBITMQ_DLQ_ROUTING_KEY when provided', () => {
    const topology = resolveRabbitMqTopology({
      RABBITMQ_DLQ: 'billing.custom.dlq',
      RABBITMQ_DLQ_ROUTING_KEY: 'billing.custom.dead-letter.route'
    });

    expect(topology.deadLetterQueue).toBe('billing.custom.dlq');
    expect(topology.deadLetterRoutingKey).toBe('billing.custom.dead-letter.route');
  });

  it('falls back DLQ routing key to RABBITMQ_DLQ when key env is not provided', () => {
    const topology = resolveRabbitMqTopology({
      RABBITMQ_DLQ: 'billing.fallback.dlq'
    });

    expect(topology.deadLetterRoutingKey).toBe('billing.fallback.dlq');
  });

  it('declares queue topology with matching dead-letter arguments and bindings', async () => {
    const topology = resolveRabbitMqTopology({
      RABBITMQ_EXCHANGE: 'billing.events.custom',
      RABBITMQ_QUEUE: 'billing.jobs.custom',
      RABBITMQ_ROUTING_KEY: 'billing.job.custom.created',
      RABBITMQ_DLX: 'billing.dlx.custom',
      RABBITMQ_DLQ: 'billing.jobs.custom.dlq',
      RABBITMQ_DLQ_ROUTING_KEY: 'billing.jobs.custom.dlq.route'
    });

    const channel = {
      assertExchange: jest.fn().mockResolvedValue(undefined),
      assertQueue: jest.fn().mockResolvedValue(undefined),
      bindQueue: jest.fn().mockResolvedValue(undefined)
    };

    await declareRabbitMqTopology(channel, topology);

    expect(channel.assertQueue).toHaveBeenCalledWith(topology.queue, {
      durable: true,
      arguments: createPrimaryQueueArguments(topology)
    });
    expect(channel.bindQueue).toHaveBeenCalledWith(
      topology.deadLetterQueue,
      topology.deadLetterExchange,
      topology.deadLetterRoutingKey
    );
  });
});
