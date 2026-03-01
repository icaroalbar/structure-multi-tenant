import { Injectable, UnauthorizedException } from '@nestjs/common';

import type { TenantContext } from '../../domain/tenancy/tenant-context';

interface JwtPayload {
  sub?: string;
  tenant_id?: string;
  tenantId?: string;
}

@Injectable()
export class JwtTenantExtractor {
  extractFromAuthorization(authorizationHeader?: string): TenantContext {
    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = authorizationHeader.slice('Bearer '.length).trim();
    const payload = this.parsePayload(token);
    const tenantId = payload.tenant_id ?? payload.tenantId;

    if (!tenantId) {
      throw new UnauthorizedException('tenant_id not found in token');
    }

    return {
      tenantId,
      subject: payload.sub
    };
  }

  private parsePayload(token: string): JwtPayload {
    const parts = token.split('.');

    if (parts.length !== 3 || !parts[1]) {
      throw new UnauthorizedException('Invalid JWT format');
    }

    try {
      const payload = Buffer.from(this.base64UrlToBase64(parts[1]), 'base64').toString('utf-8');
      return JSON.parse(payload) as JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid JWT payload');
    }
  }

  private base64UrlToBase64(input: string): string {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
    const padding = (4 - (normalized.length % 4)) % 4;
    return normalized + '='.repeat(padding);
  }
}
