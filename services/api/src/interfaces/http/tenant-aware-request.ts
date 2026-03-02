import type { Request } from 'express';

import type { TenantContext } from '../../domain/tenancy/tenant-context';

export interface TenantAwareRequest extends Request {
  tenantContext?: TenantContext;
}
