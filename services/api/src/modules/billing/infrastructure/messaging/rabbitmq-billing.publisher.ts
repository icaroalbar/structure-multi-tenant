import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  SpanStatusCode,
  context,
  metrics,
  trace
} from '@opentelemetry/api';
import { Channel, ChannelModel, connect } from 'amqplib';
import { createNestRmqEventEnvelope } from '../../../../../../shared/contracts/billing-job.contract';
import { injectTraceContextToHeaders } from '../../../../../../shared/observability/rmq-trace-context';
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
  private readonly tracer = trace.getTracer('platform-api.billing-publisher');
  private readonly meter = metrics.getMeter('platform-api.billing-publisher');
  private readonly publishedMessagesCounter = this.meter.createCounter('billing_job_publish_total', {
    description: 'Total number of billing job messages published to RabbitMQ'
  });
  private readonly publishDurationMs = this.meter.createHistogram('billing_job_publish_duration_ms', {
    description: 'Duration of billing job publish operation in milliseconds'
  });
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
    const startedAt = Date.now();

    await this.tracer.startActiveSpan('billing.job.publish', async span => {
      span.setAttribute('messaging.system', 'rabbitmq');
      span.setAttribute('messaging.destination.name', this.topology.exchange);
      span.setAttribute('messaging.rabbitmq.routing_key', this.topology.routingKey);
      span.setAttribute('billing.job.id', message.jobId);
      span.setAttribute('saas.tenant.id', message.tenantId);

      try {
        const channel = await this.ensureConnection();
        const envelope = createNestRmqEventEnvelope(this.topology.routingKey, message);
        const body = Buffer.from(JSON.stringify(envelope));
        const headers = injectTraceContextToHeaders(context.active());

        channel.publish(this.topology.exchange, this.topology.routingKey, body, {
          persistent: true,
          contentType: 'application/json',
          messageId: message.jobId,
          timestamp: Date.now(),
          headers
        });

        this.publishedMessagesCounter.add(1, {
          tenant_id: message.tenantId
        });
        span.setStatus({ code: SpanStatusCode.OK });
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: (error as Error).message
        });
        throw error;
      } finally {
        this.publishDurationMs.record(Date.now() - startedAt, {
          tenant_id: message.tenantId
        });
        span.end();
      }
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
}
