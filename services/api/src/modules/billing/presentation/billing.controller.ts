import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateBillingJobUseCase } from '../application/use-cases/create-billing-job.use-case';
import { CreateBillingJobDto } from './dto/create-billing-job.dto';
import { TenantAuthGuard } from '../../../infrastructure/auth/tenant-auth.guard';
import type { TenantAwareRequest } from '../../../interfaces/http/tenant-aware-request';

@Controller('v1/billing')
export class BillingController {
  constructor(private readonly createBillingJob: CreateBillingJobUseCase) {}

  @Post('jobs')
  @UseGuards(TenantAuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  async createJob(
    @Req() request: TenantAwareRequest,
    @Body() dto: CreateBillingJobDto,
  ): Promise<{ jobId: string; tenantId: string; status: 'queued' }> {
    const tenantId = request.tenantContext?.tenantId;

    if (!tenantId) {
      throw new InternalServerErrorException('Tenant not resolved from JWT');
    }

    const job = await this.createBillingJob.execute({
      tenantId,
      customerId: dto.customerId,
      amount: dto.amount,
    });

    return {
      jobId: job.id,
      tenantId: job.tenantId,
      status: 'queued',
    };
  }
}
