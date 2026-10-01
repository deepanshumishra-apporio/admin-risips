/** The API's `{ error: { code, message } }` envelope, as a throwable. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** The session is missing, expired, idle-timed-out or revoked. */
  get isUnauthenticated(): boolean {
    return this.status === 401 && this.code === 'UNAUTHORIZED';
  }

  get isForbidden(): boolean {
    return this.status === 403 && this.code === 'FORBIDDEN';
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}
