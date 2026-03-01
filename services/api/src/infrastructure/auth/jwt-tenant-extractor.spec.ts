import { UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';

import { JwtTenantExtractor } from './jwt-tenant-extractor';

describe('JwtTenantExtractor', () => {
  const secret = 'test-secret';

  beforeEach(() => {
    process.env.JWT_SECRET = secret;
    process.env.JWT_ALGORITHM = 'HS256';
  });

  it('extracts tenant context when token is valid', () => {
    const extractor = new JwtTenantExtractor();
    const token = jwt.sign(
      {
        tenant_id: 'tenant-a',
        sub: 'user-1'
      },
      secret,
      { expiresIn: '1h' }
    );

    const context = extractor.extractFromAuthorization(`Bearer ${token}`);

    expect(context).toEqual({
      tenantId: 'tenant-a',
      subject: 'user-1'
    });
  });

  it('rejects token with invalid signature', () => {
    const extractor = new JwtTenantExtractor();
    const token = jwt.sign(
      {
        tenant_id: 'tenant-a',
        sub: 'user-1'
      },
      'wrong-secret',
      { expiresIn: '1h' }
    );

    expect(() => extractor.extractFromAuthorization(`Bearer ${token}`)).toThrow(
      new UnauthorizedException('Invalid JWT token')
    );
  });

  it('rejects expired token', () => {
    const extractor = new JwtTenantExtractor();
    const token = jwt.sign(
      {
        tenant_id: 'tenant-a',
        sub: 'user-1'
      },
      secret,
      { expiresIn: '-1s' }
    );

    expect(() => extractor.extractFromAuthorization(`Bearer ${token}`)).toThrow(
      new UnauthorizedException('JWT expired')
    );
  });

  it('rejects token when tenant_id claim is missing', () => {
    const extractor = new JwtTenantExtractor();
    const token = jwt.sign(
      {
        sub: 'user-1'
      },
      secret,
      { expiresIn: '1h' }
    );

    expect(() => extractor.extractFromAuthorization(`Bearer ${token}`)).toThrow(
      new UnauthorizedException('tenant_id claim is required')
    );
  });
});
