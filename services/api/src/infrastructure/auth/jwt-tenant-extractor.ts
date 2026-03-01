import { Injectable, UnauthorizedException } from '@nestjs/common';
import jwt, {
  JsonWebTokenError,
  JwtPayload,
  TokenExpiredError
} from 'jsonwebtoken';

import type { TenantContext } from '../../domain/tenancy/tenant-context';
import { loadJwtRuntimeConfig } from './jwt-config';

@Injectable()
export class JwtTenantExtractor {
  private readonly jwtConfig = loadJwtRuntimeConfig();

  extractFromAuthorization(authorizationHeader?: string): TenantContext {
    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = authorizationHeader.slice('Bearer '.length).trim();
    const payload = this.verifyAndDecode(token);
    const tenantId = payload.tenant_id;
    const subject = payload.sub;
    const expiration = payload.exp;

    if (typeof tenantId !== 'string' || tenantId.length === 0) {
      throw new UnauthorizedException('tenant_id claim is required');
    }

    if (typeof subject !== 'string' || subject.length === 0) {
      throw new UnauthorizedException('sub claim is required');
    }

    if (typeof expiration !== 'number') {
      throw new UnauthorizedException('exp claim is required');
    }

    return {
      tenantId,
      subject
    };
  }

  private verifyAndDecode(token: string): JwtPayload & { tenant_id?: unknown } {
    try {
      const payload = jwt.verify(token, this.jwtConfig.secret, {
        algorithms: [this.jwtConfig.algorithm]
      });

      if (typeof payload === 'string') {
        throw new UnauthorizedException('Invalid JWT payload');
      }

      return payload as JwtPayload & { tenant_id?: unknown };
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('JWT expired');
      }

      if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException('Invalid JWT token');
      }

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid JWT token');
    }
  }
}
