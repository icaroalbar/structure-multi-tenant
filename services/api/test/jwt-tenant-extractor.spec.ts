import { UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';

import { JwtTenantExtractor } from '../src/infrastructure/auth/jwt-tenant-extractor';

describe('JwtTenantExtractor', () => {
  const secret = 'test-secret';
  const originalJwtSecret = process.env.JWT_SECRET;
  const originalJwtAlgorithm = process.env.JWT_ALGORITHM;
  let extractor: JwtTenantExtractor;

  beforeEach(() => {
    process.env.JWT_SECRET = secret;
    process.env.JWT_ALGORITHM = 'HS256';
    extractor = new JwtTenantExtractor();
  });

  afterAll(() => {
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }

    if (originalJwtAlgorithm === undefined) {
      delete process.env.JWT_ALGORITHM;
    } else {
      process.env.JWT_ALGORITHM = originalJwtAlgorithm;
    }
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

  it('throws when JWT secret is invalid for token signature', () => {
    const token = jwt.sign({ tenant_id: 'tenant-1', sub: 'user-1' }, 'wrong-secret', {
      expiresIn: '1h'
    });

    expect(() => extractor.extractFromAuthorization(`Bearer ${token}`)).toThrow(
      new UnauthorizedException('Invalid JWT token')
    );
  });

  it('fails when JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET;

    expect(() => new JwtTenantExtractor()).toThrow(new Error('JWT_SECRET is required'));
  });

  it('fails when JWT_ALGORITHM is missing', () => {
    delete process.env.JWT_ALGORITHM;

    expect(() => new JwtTenantExtractor()).toThrow(new Error('JWT_ALGORITHM is required'));
  });
});
