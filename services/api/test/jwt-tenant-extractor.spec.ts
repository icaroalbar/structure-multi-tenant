import { UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';

import { JwtTenantExtractor } from '../src/infrastructure/auth/jwt-tenant-extractor';

describe('JwtTenantExtractor', () => {
  const secret = 'test-secret';
  let extractor: JwtTenantExtractor;

  beforeEach(() => {
    process.env.JWT_SECRET = secret;
    process.env.JWT_ALGORITHM = 'HS256';
    extractor = new JwtTenantExtractor();
  });

  it('extracts tenant_id and sub from token', () => {
    const token = jwt.sign({ tenant_id: 'tenant-1', sub: 'user-1' }, secret, {
      expiresIn: '1h'
    });

    expect(extractor.extractFromAuthorization(`Bearer ${token}`)).toEqual({
      tenantId: 'tenant-1',
      subject: 'user-1'
    });
  });

  it('throws when tenant_id is missing', () => {
    const token = jwt.sign({ sub: 'user-1' }, secret, {
      expiresIn: '1h'
    });

    expect(() => extractor.extractFromAuthorization(`Bearer ${token}`)).toThrow(
      UnauthorizedException
    );
  });
});
