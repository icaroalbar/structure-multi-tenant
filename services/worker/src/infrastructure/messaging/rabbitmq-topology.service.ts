import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { Channel, ChannelModel } from 'amqplib';
import { connect } from 'amqplib';

import { RABBITMQ_TOPOLOGY } from './rabbitmq.constants';

@Injectable()
export class RabbitMqTopologyService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqTopologyService.name);
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;

  async onModuleInit(): Promise<void> {
    const connection = await connect(RABBITMQ_TOPOLOGY.url);
    const channel = await connection.createChannel();
    this.connection = connection;
    this.channel = channel;

    await channel.assertExchange(RABBITMQ_TOPOLOGY.exchange, 'direct', { durable: true });
    await channel.assertExchange(RABBITMQ_TOPOLOGY.deadLetterExchange, 'direct', {
      durable: true
    });

    await channel.assertQueue(RABBITMQ_TOPOLOGY.queue, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': RABBITMQ_TOPOLOGY.deadLetterExchange,
        'x-dead-letter-routing-key': RABBITMQ_TOPOLOGY.deadLetterRoutingKey
      }
    });

    await channel.assertQueue(RABBITMQ_TOPOLOGY.deadLetterQueue, {
      durable: true
    });

    await channel.bindQueue(
      RABBITMQ_TOPOLOGY.queue,
      RABBITMQ_TOPOLOGY.exchange,
      RABBITMQ_TOPOLOGY.routingKey
    );

    await channel.bindQueue(
      RABBITMQ_TOPOLOGY.deadLetterQueue,
      RABBITMQ_TOPOLOGY.deadLetterExchange,
      RABBITMQ_TOPOLOGY.deadLetterRoutingKey
    );

    this.logger.log('RabbitMQ topology configured (queue + DLQ)');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
      this.channel = null;
    }

    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }
}
