import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { JwtTenantExtractor } from './jwt-tenant-extractor';
import type { TenantAwareRequest } from '../../interfaces/http/tenant-aware-request';

@Injectable()
export class TenantAuthGuard implements CanActivate {
  constructor(private readonly jwtTenantExtractor: JwtTenantExtractor) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<TenantAwareRequest>();
    request.tenantContext = this.jwtTenantExtractor.extractFromAuthorization(request.headers.authorization);
    return true;
  }
}
