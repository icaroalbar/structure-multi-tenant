import { Injectable, UnauthorizedException } from '@nestjs/common';

import type { TenantContext } from '../../domain/tenancy/tenant-context';
import type { GetTenantContextInput } from './get-tenant-context.input';

@Injectable()
export class GetTenantContextUseCase {
  execute(input: GetTenantContextInput): TenantContext {
    if (!input.tenantContext) {
      throw new UnauthorizedException('Tenant context not available');
    }

    return input.tenantContext;
  }
}
