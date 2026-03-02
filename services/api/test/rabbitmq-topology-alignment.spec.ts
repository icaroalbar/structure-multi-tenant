describe('RabbitMQ topology alignment between API and Worker', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  it('uses equivalent topology contract with custom dead-letter routing key', async () => {
    process.env = {
      ...originalEnv,
      RABBITMQ_URL: 'amqp://localhost:5673',
      RABBITMQ_EXCHANGE: 'billing.events.custom',
      RABBITMQ_QUEUE: 'billing.jobs.custom',
      RABBITMQ_ROUTING_KEY: 'billing.job.custom.created',
      RABBITMQ_DLX: 'billing.dlx.custom',
      RABBITMQ_DLQ: 'billing.jobs.custom.dlq',
      RABBITMQ_DLQ_ROUTING_KEY: 'billing.jobs.custom.dlq.route'
    };
    jest.resetModules();

    const { RABBITMQ_TOPOLOGY } = await import(
      '../../worker/src/infrastructure/messaging/rabbitmq.constants'
    );
    const { RabbitMqBillingPublisher } = await import(
      '../src/modules/billing/infrastructure/messaging/rabbitmq-billing.publisher'
    );

    const publisher = new RabbitMqBillingPublisher() as unknown as {
      topology: typeof RABBITMQ_TOPOLOGY;
    };

    expect(publisher.topology).toEqual(RABBITMQ_TOPOLOGY);
    expect(publisher.topology.deadLetterRoutingKey).toBe('billing.jobs.custom.dlq.route');
    expect(publisher.topology.deadLetterQueue).toBe('billing.jobs.custom.dlq');
  });
});
