import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { Channel, ChannelModel } from 'amqplib';
import { connect } from 'amqplib';

import { declareRabbitMqTopology } from '../../../../shared/contracts/rabbitmq-topology.contract';
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

    await declareRabbitMqTopology(channel, RABBITMQ_TOPOLOGY);

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
