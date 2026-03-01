import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Channel, ChannelModel, connect } from 'amqplib';
import {
  BillingJobMessage,
  BillingPublisher,
} from './billing-publisher.port';

@Injectable()
export class RabbitMqBillingPublisher
  implements BillingPublisher, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RabbitMqBillingPublisher.name);
  private connection?: ChannelModel;
  private channel?: Channel;

  private readonly rabbitUrl = process.env.RABBITMQ_URL ?? 'amqp://localhost:5672';
  private readonly exchange = process.env.RABBITMQ_EXCHANGE ?? 'billing.events';
  private readonly queue = process.env.RABBITMQ_QUEUE ?? 'billing.jobs';
  private readonly routingKey =
    process.env.RABBITMQ_ROUTING_KEY ?? 'billing.job.created';
  private readonly dlx = process.env.RABBITMQ_DLX ?? 'billing.dlx';
  private readonly dlq = process.env.RABBITMQ_DLQ ?? 'billing.jobs.dlq';

  async onModuleInit(): Promise<void> {
    try {
      await this.ensureConnection();
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(`RabbitMQ unavailable on startup (${reason}). Publisher will retry lazily.`);
    }
  }

  private async ensureConnection(): Promise<Channel> {
    if (this.channel) {
      return this.channel;
    }

    this.connection = await connect(this.rabbitUrl);
    const channel = await this.connection.createChannel();
    this.channel = channel;

    await channel.assertExchange(this.exchange, 'direct', { durable: true });
    await channel.assertExchange(this.dlx, 'direct', { durable: true });

    await channel.assertQueue(this.queue, {
      durable: true,
      deadLetterExchange: this.dlx,
      deadLetterRoutingKey: this.dlq,
    });
    await channel.assertQueue(this.dlq, { durable: true });

    await channel.bindQueue(this.queue, this.exchange, this.routingKey);
    await channel.bindQueue(this.dlq, this.dlx, this.dlq);

    return channel;
  }

  async publish(message: BillingJobMessage): Promise<void> {
    const channel = await this.ensureConnection();

    const body = Buffer.from(JSON.stringify(message));
    channel.publish(this.exchange, this.routingKey, body, {
      persistent: true,
      contentType: 'application/json',
      messageId: message.jobId,
      timestamp: Date.now(),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
}
