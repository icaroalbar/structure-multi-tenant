export class BillingJobEntity {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly customerId: string,
    public readonly amount: number,
    public readonly createdAt: Date,
  ) {}
}
