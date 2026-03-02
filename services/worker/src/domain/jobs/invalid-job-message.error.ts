export class InvalidJobMessageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidJobMessageError';
  }
}
