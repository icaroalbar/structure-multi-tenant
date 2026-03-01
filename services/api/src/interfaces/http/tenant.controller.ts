import { Controller, Get, Req, UseGuards } from '@nestjs/common';

import type { GetTenantContextInput } from '../../application/tenancy/get-tenant-context.input';
import { GetTenantContextUseCase } from '../../application/tenancy/get-tenant-context.usecase';
import { TenantAuthGuard } from '../../infrastructure/auth/tenant-auth.guard';
import type { TenantAwareRequest } from './tenant-aware-request';
import type { TenantContext } from '../../domain/tenancy/tenant-context';

@Controller('tenant')
export class TenantController {
  constructor(private readonly getTenantContextUseCase: GetTenantContextUseCase) {}

  @Get('me')
  @UseGuards(TenantAuthGuard)
  me(@Req() request: TenantAwareRequest): TenantContext {
    const input: GetTenantContextInput = {
      tenantContext: request.tenantContext
    };

    return this.getTenantContextUseCase.execute(input);
  }
}
