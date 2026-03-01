import { Controller } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';

import { assertBillingJobMessage } from '../../../../shared/contracts/billing-job.contract';
import { ProcessJobUseCase } from '../../application/jobs/process-job.usecase';
import { InvalidJobMessageError } from '../../domain/jobs/invalid-job-message.error';
import type { JobMessage } from '../../domain/jobs/job-message';
import { RABBITMQ_TOPOLOGY } from '../../infrastructure/messaging/rabbitmq.constants';

@Controller()
export class JobConsumer {
  constructor(private readonly processJobUseCase: ProcessJobUseCase) {}

  @MessagePattern(RABBITMQ_TOPOLOGY.routingKey)
  async consume(@Payload() message: unknown, @Ctx() context: RmqContext): Promise<void> {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();

    try {
      this.assertValidMessage(message);
      await this.processJobUseCase.execute(message);
      channel.ack(originalMessage);
    } catch (error) {
      channel.nack(originalMessage, false, false);
      throw error;
    }
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
