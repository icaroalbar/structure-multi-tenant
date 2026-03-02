import { ProcessJobUseCase } from '../src/application/jobs/process-job.usecase';
import type { IdempotencyPort } from '../src/application/jobs/ports/idempotency.port';

describe('ProcessJobUseCase', () => {
  it('returns duplicate when idempotency key is already reserved', async () => {
    const redisIdempotencyService = {
      reserve: jest.fn().mockResolvedValue(false)
    } as unknown as IdempotencyPort;

    const useCase = new ProcessJobUseCase(redisIdempotencyService);

    await expect(
      useCase.execute({
        jobId: '1',
        tenantId: 'tenant-a',
        customerId: 'customer-1',
        amount: 100,
        issuedAt: '2026-03-01T00:00:00.000Z'
      })
    ).resolves.toBe('duplicate');
  });

  it('throws and allows DLQ path when forceError is true', async () => {
    const redisIdempotencyService = {
      reserve: jest.fn().mockResolvedValue(true)
    } as unknown as IdempotencyPort;

    const useCase = new ProcessJobUseCase(redisIdempotencyService);

    await expect(
      useCase.execute({
        jobId: '1',
        tenantId: 'tenant-a',
        customerId: 'customer-1',
        amount: 100,
        issuedAt: '2026-03-01T00:00:00.000Z',
        forceError: true
      })
    ).rejects.toThrow('Forced failure to route message to DLQ');
  });
});
