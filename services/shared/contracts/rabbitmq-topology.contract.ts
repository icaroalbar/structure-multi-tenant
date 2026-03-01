export interface RabbitMqTopology {
  url: string;
  exchange: string;
  queue: string;
  routingKey: string;
  deadLetterExchange: string;
  deadLetterQueue: string;
  deadLetterRoutingKey: string;
}

export interface RabbitMqTopologyChannel {
  assertExchange(exchange: string, type: 'direct', options: { durable: boolean }): Promise<unknown>;
  assertQueue(
    queue: string,
    options: { durable: boolean; arguments?: Record<string, string> }
  ): Promise<unknown>;
  bindQueue(queue: string, source: string, pattern: string): Promise<unknown>;
}

const DEFAULT_RABBITMQ_TOPOLOGY: RabbitMqTopology = {
  url: 'amqp://localhost:5672',
  exchange: 'billing.events',
  queue: 'billing.jobs',
  routingKey: 'billing.job.created',
  deadLetterExchange: 'billing.dlx',
  deadLetterQueue: 'billing.jobs.dlq',
  deadLetterRoutingKey: 'billing.jobs.dlq'
};

function readEnvValue(env: NodeJS.ProcessEnv, key: keyof NodeJS.ProcessEnv): string | undefined {
  const value = env[key];

  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function resolveRabbitMqTopology(env: NodeJS.ProcessEnv = process.env): RabbitMqTopology {
  const deadLetterQueue =
    readEnvValue(env, 'RABBITMQ_DLQ') ?? DEFAULT_RABBITMQ_TOPOLOGY.deadLetterQueue;
  // Backward compatibility: if routing-key env is absent, preserve legacy behavior from RABBITMQ_DLQ.
  const deadLetterRoutingKey =
    readEnvValue(env, 'RABBITMQ_DLQ_ROUTING_KEY') ??
    readEnvValue(env, 'RABBITMQ_DLQ') ??
    DEFAULT_RABBITMQ_TOPOLOGY.deadLetterRoutingKey;

  return {
    url: readEnvValue(env, 'RABBITMQ_URL') ?? DEFAULT_RABBITMQ_TOPOLOGY.url,
    exchange: readEnvValue(env, 'RABBITMQ_EXCHANGE') ?? DEFAULT_RABBITMQ_TOPOLOGY.exchange,
    queue: readEnvValue(env, 'RABBITMQ_QUEUE') ?? DEFAULT_RABBITMQ_TOPOLOGY.queue,
    routingKey:
      readEnvValue(env, 'RABBITMQ_ROUTING_KEY') ?? DEFAULT_RABBITMQ_TOPOLOGY.routingKey,
    deadLetterExchange:
      readEnvValue(env, 'RABBITMQ_DLX') ?? DEFAULT_RABBITMQ_TOPOLOGY.deadLetterExchange,
    deadLetterQueue,
    deadLetterRoutingKey
  };
}

export function createPrimaryQueueArguments(topology: RabbitMqTopology): Record<string, string> {
  return {
    'x-dead-letter-exchange': topology.deadLetterExchange,
    'x-dead-letter-routing-key': topology.deadLetterRoutingKey
  };
}

export async function declareRabbitMqTopology(
  channel: RabbitMqTopologyChannel,
  topology: RabbitMqTopology
): Promise<void> {
  await channel.assertExchange(topology.exchange, 'direct', { durable: true });
  await channel.assertExchange(topology.deadLetterExchange, 'direct', { durable: true });

  await channel.assertQueue(topology.queue, {
    durable: true,
    arguments: createPrimaryQueueArguments(topology)
  });
  await channel.assertQueue(topology.deadLetterQueue, { durable: true });

  await channel.bindQueue(topology.queue, topology.exchange, topology.routingKey);
  await channel.bindQueue(
    topology.deadLetterQueue,
    topology.deadLetterExchange,
    topology.deadLetterRoutingKey
  );
}
