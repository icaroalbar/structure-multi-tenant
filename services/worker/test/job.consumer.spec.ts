import type { RmqContext } from '@nestjs/microservices';

import {
  createNestRmqEventEnvelope,
  type BillingJobMessage
} from '../../shared/contracts/billing-job.contract';
import { ProcessJobUseCase } from '../src/application/jobs/process-job.usecase';
import { InvalidJobMessageError } from '../src/domain/jobs/invalid-job-message.error';
import type { JobMessage } from '../src/domain/jobs/job-message';
import { RABBITMQ_TOPOLOGY } from '../src/infrastructure/messaging/rabbitmq.constants';
import { JobConsumer } from '../src/interfaces/messages/job.consumer';

describe('JobConsumer', () => {
  const validMessage: JobMessage = {
    tenantId: 'tenant-a',
    jobId: 'job-1',
    customerId: 'customer-1',
    amount: 100,
    issuedAt: '2026-03-01T00:00:00.000Z'
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
    [{ jobId: 'job-1', customerId: 'customer-1', amount: 10, issuedAt: 'x' }, 'tenantId is required'],
    [
      { tenantId: '   ', jobId: 'job-1', customerId: 'customer-1', amount: 10, issuedAt: 'x' },
      'tenantId is required'
    ],
    [{ tenantId: 'tenant-a', customerId: 'customer-1', amount: 10, issuedAt: 'x' }, 'jobId is required'],
    [
      { tenantId: 'tenant-a', jobId: '   ', customerId: 'customer-1', amount: 10, issuedAt: 'x' },
      'jobId is required'
    ],
    [{ tenantId: 'tenant-a', jobId: 'job-1', amount: 10, issuedAt: 'x' }, 'customerId is required'],
    [
      { tenantId: 'tenant-a', jobId: 'job-1', customerId: 'customer-1', issuedAt: 'x' },
      'amount must be a finite number'
    ],
    [{ tenantId: 'tenant-a', jobId: 'job-1', customerId: 'customer-1', amount: 10 }, 'issuedAt is required'],
    [
      {
        tenantId: 'tenant-a',
        jobId: 'job-1',
        customerId: 'customer-1',
        amount: 10,
        issuedAt: 'x',
        forceError: 'true'
      },
      'forceError must be a boolean'
    ]
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

  it('accepts optional forceError flag when it is boolean', async () => {
    (processJobUseCase.execute as jest.Mock).mockResolvedValue('processed');

    await consumer.consume(
      {
        ...validMessage,
        forceError: false
      },
      rmqContext
    );

    expect(processJobUseCase.execute).toHaveBeenCalledWith({
      ...validMessage,
      forceError: false
    });
    expect(channel.ack).toHaveBeenCalledWith(originalMessage);
    expect(channel.nack).not.toHaveBeenCalled();
  });

  it('accepts API serialized envelope payload and processes it', async () => {
    (processJobUseCase.execute as jest.Mock).mockResolvedValue('processed');
    const payload: BillingJobMessage = {
      tenantId: 'tenant-a',
      jobId: 'job-1',
      customerId: 'customer-1',
      amount: 150,
      issuedAt: '2026-03-01T00:00:00.000Z'
    };

    const serialized = Buffer.from(
      JSON.stringify(createNestRmqEventEnvelope(RABBITMQ_TOPOLOGY.routingKey, payload))
    );
    const decoded = JSON.parse(serialized.toString()) as {
      pattern: string;
      data: BillingJobMessage;
    };

    await consumer.consume(decoded.data, rmqContext);

    expect(decoded.pattern).toBe(RABBITMQ_TOPOLOGY.routingKey);
    expect(processJobUseCase.execute).toHaveBeenCalledWith(payload);
    expect(channel.ack).toHaveBeenCalledWith(originalMessage);
    expect(channel.nack).not.toHaveBeenCalled();
  });
});
