import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Channel, ChannelModel, connect } from 'amqplib';
import { createNestRmqEventEnvelope } from '../../../../../../shared/contracts/billing-job.contract';
import {
  declareRabbitMqTopology,
  resolveRabbitMqTopology
} from '../../../../../../shared/contracts/rabbitmq-topology.contract';
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

  private readonly topology = resolveRabbitMqTopology();

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

    this.connection = await connect(this.topology.url);
    const channel = await this.connection.createChannel();
    this.channel = channel;

    await declareRabbitMqTopology(channel, this.topology);

    return channel;
  }

  async publish(message: BillingJobMessage): Promise<void> {
    const channel = await this.ensureConnection();

    const envelope = createNestRmqEventEnvelope(this.topology.routingKey, message);
    const body = Buffer.from(JSON.stringify(envelope));

    channel.publish(this.topology.exchange, this.topology.routingKey, body, {
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
