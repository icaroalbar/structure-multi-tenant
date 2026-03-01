import type { RmqContext } from '@nestjs/microservices';

import { ProcessJobUseCase } from '../src/application/jobs/process-job.usecase';
import { InvalidJobMessageError } from '../src/domain/jobs/invalid-job-message.error';
import type { JobMessage } from '../src/domain/jobs/job-message';
import { JobConsumer } from '../src/interfaces/messages/job.consumer';

describe('JobConsumer', () => {
  const validMessage: JobMessage = {
    tenantId: 'tenant-a',
    jobId: 'job-1',
    payload: { amount: 100 }
  };

  const originalMessage = { fields: { routingKey: 'billing.job.created' } };
  const channel = {
    ack: jest.fn(),
    nack: jest.fn()
  };

  const rmqContext = {
    getChannelRef: jest.fn().mockReturnValue(channel),
    getMessage: jest.fn().mockReturnValue(originalMessage)
  } as unknown as RmqContext;

  const processJobUseCase = {
    execute: jest.fn()
  } as unknown as ProcessJobUseCase;

  const consumer = new JobConsumer(processJobUseCase);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('processes valid payload and acks message', async () => {
    (processJobUseCase.execute as jest.Mock).mockResolvedValue('processed');

    await consumer.consume(validMessage, rmqContext);

    expect(processJobUseCase.execute).toHaveBeenCalledWith(validMessage);
    expect(channel.ack).toHaveBeenCalledWith(originalMessage);
    expect(channel.nack).not.toHaveBeenCalled();
  });

  it('nacks and rethrows when processing fails', async () => {
    const error = new Error('processing failed');
    (processJobUseCase.execute as jest.Mock).mockRejectedValue(error);

    await expect(consumer.consume(validMessage, rmqContext)).rejects.toThrow('processing failed');

    expect(channel.ack).not.toHaveBeenCalled();
    expect(channel.nack).toHaveBeenCalledWith(originalMessage, false, false);
  });

  it.each([
    [null, 'Invalid job message payload'],
    [{ jobId: 'job-1', payload: {} }, 'tenantId is required'],
    [{ tenantId: '   ', jobId: 'job-1', payload: {} }, 'tenantId is required'],
    [{ tenantId: 'tenant-a', payload: {} }, 'jobId is required'],
    [{ tenantId: 'tenant-a', jobId: '   ', payload: {} }, 'jobId is required'],
    [{ tenantId: 'tenant-a', jobId: 'job-1' }, 'payload is required']
  ])(
    'nacks invalid payload and skips processing: %p',
    async (invalidPayload: unknown, expectedMessage: string) => {
      await expect(consumer.consume(invalidPayload, rmqContext)).rejects.toEqual(
        expect.objectContaining({
          name: InvalidJobMessageError.name,
          message: expectedMessage
        })
      );

      expect(processJobUseCase.execute).not.toHaveBeenCalled();
      expect(channel.ack).not.toHaveBeenCalled();
      expect(channel.nack).toHaveBeenCalledWith(originalMessage, false, false);
    }
  );
});
