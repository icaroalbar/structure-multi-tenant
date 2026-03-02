import { Injectable } from '@nestjs/common';

import type { TenantContext } from '../../domain/tenancy/tenant-context';
import { TenantContextNotAvailableError } from '../../domain/tenancy/errors/tenant-context-not-available.error';
import type { GetTenantContextInput } from './get-tenant-context.input';

@Injectable()
export class GetTenantContextUseCase {
  execute(input: GetTenantContextInput): TenantContext {
    if (!input.tenantContext) {
      throw new TenantContextNotAvailableError();
    }

    return input.tenantContext;
  }
}
