import { Injectable, UnauthorizedException } from '@nestjs/common';

import type { TenantContext } from '../../domain/tenancy/tenant-context';
import type { TenantAwareRequest } from '../../interfaces/http/tenant-aware-request';

@Injectable()
export class GetTenantContextUseCase {
  execute(request: TenantAwareRequest): TenantContext {
    if (!request.tenantContext) {
      throw new UnauthorizedException('Tenant context not available');
    }

    return request.tenantContext;
  }
}
