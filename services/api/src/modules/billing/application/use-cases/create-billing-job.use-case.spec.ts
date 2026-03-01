import { CreateBillingJobUseCase } from './create-billing-job.use-case';
import { BillingPublisher } from '../../infrastructure/messaging/billing-publisher.port';

describe('CreateBillingJobUseCase', () => {
  it('publishes a job message with tenant context', async () => {
    const publishMock = jest.fn().mockResolvedValue(undefined);
    const publisher: BillingPublisher = { publish: publishMock };

    const useCase = new CreateBillingJobUseCase(publisher);

    const result = await useCase.execute({
      tenantId: 'tenant-a',
      customerId: 'customer-1',
      amount: 150,
    });

    expect(result.tenantId).toBe('tenant-a');
    expect(result.customerId).toBe('customer-1');
    expect(result.amount).toBe(150);
    expect(publishMock).toHaveBeenCalledTimes(1);
    expect(publishMock).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: expect.any(String),
        tenantId: 'tenant-a',
        customerId: 'customer-1',
        amount: 150,
        issuedAt: expect.any(String),
      }),
    );
  });
});
