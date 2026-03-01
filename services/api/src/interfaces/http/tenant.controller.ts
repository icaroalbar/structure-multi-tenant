import { Controller, Get, Req, UseGuards } from '@nestjs/common';

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
    return this.getTenantContextUseCase.execute(request);
  }
}
