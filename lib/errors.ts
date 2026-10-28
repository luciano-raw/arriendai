export class AccessError extends Error {
  constructor(message: string, public status = 403) { super(message); }
}
