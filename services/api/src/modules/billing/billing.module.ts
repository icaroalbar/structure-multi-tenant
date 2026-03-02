import { Module } from '@nestjs/common';
import { CreateBillingJobUseCase } from './application/use-cases/create-billing-job.use-case';
import { RabbitMqBillingPublisher } from './infrastructure/messaging/rabbitmq-billing.publisher';
import { BILLING_PUBLISHER } from './infrastructure/messaging/billing-publisher.port';
import { BillingController } from './presentation/billing.controller';
import { JwtTenantExtractor } from '../../infrastructure/auth/jwt-tenant-extractor';
import { TenantAuthGuard } from '../../infrastructure/auth/tenant-auth.guard';

@Module({
  controllers: [BillingController],
  providers: [
    CreateBillingJobUseCase,
    JwtTenantExtractor,
    TenantAuthGuard,
    RabbitMqBillingPublisher,
    {
      provide: BILLING_PUBLISHER,
      useExisting: RabbitMqBillingPublisher,
    },
  ],
})
export class BillingModule {}
