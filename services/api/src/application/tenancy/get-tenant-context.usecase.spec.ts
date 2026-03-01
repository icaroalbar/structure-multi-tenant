import { TenantContextNotAvailableError } from '../../domain/tenancy/errors/tenant-context-not-available.error';
import { GetTenantContextUseCase } from './get-tenant-context.usecase';

describe('GetTenantContextUseCase', () => {
  const useCase = new GetTenantContextUseCase();

  it('returns tenant context when available', () => {
    const result = useCase.execute({
      tenantContext: {
        tenantId: 'tenant-a',
        subject: 'user-1'
      }
    });

    expect(result).toEqual({ tenantId: 'tenant-a', subject: 'user-1' });
  });

  it('throws domain/application error when tenant context is missing', () => {
    expect(() => useCase.execute({ tenantContext: undefined })).toThrow(
      TenantContextNotAvailableError
    );
  });
});
