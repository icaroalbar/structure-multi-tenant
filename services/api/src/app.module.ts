import { Module } from '@nestjs/common';

import { GetTenantContextUseCase } from './application/tenancy/get-tenant-context.usecase';
import { JwtTenantExtractor } from './infrastructure/auth/jwt-tenant-extractor';
import { TenantAuthGuard } from './infrastructure/auth/tenant-auth.guard';
import { RedisService } from './infrastructure/cache/redis.service';
import { PostgresService } from './infrastructure/persistence/postgres.service';
import { HealthController } from './interfaces/http/health.controller';
import { TenantController } from './interfaces/http/tenant.controller';
import { BillingModule } from './modules/billing/billing.module';

@Module({
  imports: [BillingModule],
  controllers: [HealthController, TenantController],
  providers: [
    GetTenantContextUseCase,
    JwtTenantExtractor,
    TenantAuthGuard,
    PostgresService,
    RedisService
  ]
})
export class AppModule {}
