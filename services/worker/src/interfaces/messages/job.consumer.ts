import { Controller } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { SpanStatusCode, metrics, trace } from '@opentelemetry/api';

import { extractTraceContextFromHeaders } from '../../../../shared/observability/rmq-trace-context';
import { assertBillingJobMessage } from '../../../../shared/contracts/billing-job.contract';
import { ProcessJobUseCase } from '../../application/jobs/process-job.usecase';
import { InvalidJobMessageError } from '../../domain/jobs/invalid-job-message.error';
import type { JobMessage } from '../../domain/jobs/job-message';
import { RABBITMQ_TOPOLOGY } from '../../infrastructure/messaging/rabbitmq.constants';

@Controller()
export class JobConsumer {
  private readonly tracer = trace.getTracer('platform-worker.job-consumer');
  private readonly meter = metrics.getMeter('platform-worker.job-consumer');
  private readonly processedJobsCounter = this.meter.createCounter('billing_job_consume_total', {
    description: 'Total number of billing job consume attempts grouped by outcome'
  });
  private readonly consumeDurationMs = this.meter.createHistogram('billing_job_consume_duration_ms', {
    description: 'Duration of billing job consume operation in milliseconds'
  });

  constructor(private readonly processJobUseCase: ProcessJobUseCase) {}

  @MessagePattern(RABBITMQ_TOPOLOGY.routingKey)
  async consume(@Payload() message: unknown, @Ctx() context: RmqContext): Promise<void> {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();
    const headers = originalMessage?.properties?.headers as Record<string, unknown> | undefined;
    const parentContext = extractTraceContextFromHeaders(headers);
    const startedAt = Date.now();

    await this.tracer.startActiveSpan(
      'billing.job.consume',
      {
        attributes: {
          'messaging.system': 'rabbitmq',
          'messaging.destination.name': RABBITMQ_TOPOLOGY.queue,
          'messaging.rabbitmq.routing_key': RABBITMQ_TOPOLOGY.routingKey
        }
      },
      parentContext,
      async span => {
        try {
          this.assertValidMessage(message);
          span.setAttribute('billing.job.id', message.jobId);
          span.setAttribute('saas.tenant.id', message.tenantId);

          await this.processJobUseCase.execute(message);
          channel.ack(originalMessage);
          this.processedJobsCounter.add(1, {
            tenant_id: message.tenantId,
            outcome: 'processed'
          });
          span.setStatus({ code: SpanStatusCode.OK });
        } catch (error) {
          channel.nack(originalMessage, false, false);

          if (message && typeof message === 'object' && 'tenantId' in message) {
            const candidate = message as { tenantId?: unknown };
            if (typeof candidate.tenantId === 'string' && candidate.tenantId.length > 0) {
              this.processedJobsCounter.add(1, {
                tenant_id: candidate.tenantId,
                outcome: 'failed'
              });
            }
          }

          span.recordException(error as Error);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: (error as Error).message
          });
          throw error;
        } finally {
          if (message && typeof message === 'object' && 'tenantId' in message) {
            const candidate = message as { tenantId?: unknown };
            if (typeof candidate.tenantId === 'string' && candidate.tenantId.length > 0) {
              this.consumeDurationMs.record(Date.now() - startedAt, {
                tenant_id: candidate.tenantId
              });
            }
          }

          span.end();
        }
      }
    );
  }

  private assertValidMessage(message: unknown): asserts message is JobMessage {
    try {
      assertBillingJobMessage(message);
    } catch (error) {
      const reason = (error as Error).message;
      throw new InvalidJobMessageError(reason);
    }

    const candidate = message as Partial<JobMessage>;
    if (
      Object.prototype.hasOwnProperty.call(candidate, 'forceError') &&
      typeof candidate.forceError !== 'boolean'
    ) {
      throw new InvalidJobMessageError('forceError must be a boolean');
    }
  }
}
