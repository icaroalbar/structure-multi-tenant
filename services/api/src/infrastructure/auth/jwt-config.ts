import type { Algorithm } from 'jsonwebtoken';

const SUPPORTED_JWT_ALGORITHMS = new Set<Algorithm>([
  'HS256',
  'HS384',
  'HS512',
  'RS256',
  'RS384',
  'RS512',
  'ES256',
  'ES384',
  'ES512',
  'PS256',
  'PS384',
  'PS512'
]);

export interface JwtRuntimeConfig {
  secret: string;
  algorithm: Algorithm;
}

export function loadJwtRuntimeConfig(env: NodeJS.ProcessEnv = process.env): JwtRuntimeConfig {
  const secret = env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error('JWT_SECRET is required');
  }

  const algorithm = env.JWT_ALGORITHM?.trim();
  if (!algorithm) {
    throw new Error('JWT_ALGORITHM is required');
  }

  if (!SUPPORTED_JWT_ALGORITHMS.has(algorithm as Algorithm)) {
    throw new Error('JWT_ALGORITHM is invalid');
  }

  return {
    secret,
    algorithm: algorithm as Algorithm
  };
}
