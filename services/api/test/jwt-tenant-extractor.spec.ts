import { UnauthorizedException } from '@nestjs/common';

import { JwtTenantExtractor } from '../src/infrastructure/auth/jwt-tenant-extractor';

function buildJwt(payload: Record<string, unknown>): string {
  const base64Url = (value: string): string =>
    Buffer.from(value, 'utf-8')
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  const header = base64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const body = base64Url(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

describe('JwtTenantExtractor', () => {
  const extractor = new JwtTenantExtractor();

  it('extracts tenant_id and sub from token', () => {
    const token = buildJwt({ tenant_id: 'tenant-1', sub: 'user-1' });

    expect(extractor.extractFromAuthorization(`Bearer ${token}`)).toEqual({
      tenantId: 'tenant-1',
      subject: 'user-1'
    });
  });

  it('throws when tenant_id is missing', () => {
    const token = buildJwt({ sub: 'user-1' });

    expect(() => extractor.extractFromAuthorization(`Bearer ${token}`)).toThrow(
      UnauthorizedException
    );
  });
});
