import { ProcessJobUseCase } from '../src/application/jobs/process-job.usecase';
import type { IdempotencyPort } from '../src/application/jobs/ports/idempotency.port';

describe('ProcessJobUseCase', () => {
  it('returns duplicate when idempotency key is already reserved', async () => {
    const redisIdempotencyService = {
      reserve: jest.fn().mockResolvedValue(false)
    } as unknown as IdempotencyPort;

    const useCase = new ProcessJobUseCase(redisIdempotencyService);

    await expect(
      useCase.execute({ jobId: '1', tenantId: 'tenant-a', payload: {} })
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
        payload: {},
        forceError: true
      })
    ).rejects.toThrow('Forced failure to route message to DLQ');
  });
});
