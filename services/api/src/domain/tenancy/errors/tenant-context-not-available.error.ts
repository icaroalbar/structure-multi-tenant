export class TenantContextNotAvailableError extends Error {
  constructor() {
    super('Tenant context not available');
    this.name = 'TenantContextNotAvailableError';
  }
}
