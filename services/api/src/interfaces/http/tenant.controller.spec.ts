import { UnauthorizedException } from '@nestjs/common';

import { GetTenantContextUseCase } from '../../application/tenancy/get-tenant-context.usecase';
import { TenantContextNotAvailableError } from '../../domain/tenancy/errors/tenant-context-not-available.error';
import type { TenantAwareRequest } from './tenant-aware-request';
import { TenantController } from './tenant.controller';

describe('TenantController', () => {
  const getTenantContextUseCase = {
    execute: jest.fn()
  } as unknown as GetTenantContextUseCase;

  const controller = new TenantController(getTenantContextUseCase);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns tenant context when use case succeeds', () => {
    (getTenantContextUseCase.execute as jest.Mock).mockReturnValue({
      tenantId: 'tenant-a',
      subject: 'user-1'
    });

    const request = {
      tenantContext: {
        tenantId: 'tenant-a',
        subject: 'user-1'
      }
    } as TenantAwareRequest;

    expect(controller.me(request)).toEqual({ tenantId: 'tenant-a', subject: 'user-1' });
  });

  it('maps application/domain error to UnauthorizedException at interface layer', () => {
    (getTenantContextUseCase.execute as jest.Mock).mockImplementation(() => {
      throw new TenantContextNotAvailableError();
    });

    const request = {} as TenantAwareRequest;

    expect(() => controller.me(request)).toThrow(
      new UnauthorizedException('Tenant context not available')
    );
  });

  it('rethrows unexpected errors', () => {
    (getTenantContextUseCase.execute as jest.Mock).mockImplementation(() => {
      throw new Error('unexpected');
    });

    const request = {} as TenantAwareRequest;

    expect(() => controller.me(request)).toThrow('unexpected');
  });
});
