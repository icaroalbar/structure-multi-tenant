export const RABBITMQ_TOPOLOGY = {
  url: process.env.RABBITMQ_URL ?? 'amqp://localhost:5672',
  exchange: process.env.RABBITMQ_EXCHANGE ?? 'billing.events',
  queue: process.env.RABBITMQ_QUEUE ?? 'billing.jobs',
  routingKey: process.env.RABBITMQ_ROUTING_KEY ?? 'billing.job.created',
  deadLetterExchange: process.env.RABBITMQ_DLX ?? 'billing.dlx',
  deadLetterQueue: process.env.RABBITMQ_DLQ ?? 'billing.jobs.dlq',
  deadLetterRoutingKey: process.env.RABBITMQ_DLQ_ROUTING_KEY ?? 'billing.jobs.dlq'
} as const;
