import 'server-only';

/**
 * Server-side configuration. Nothing here is `NEXT_PUBLIC_`: the browser never
 * talks to the API directly, so it never needs to know where the API is.
 */
function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not set. Copy .env.example to .env.local and fill it in.`);
  return value;
}

export const Config = {
  /** Origin of the RiSips API, e.g. http://localhost:3005. No trailing slash. */
  get apiUrl(): string {
    return required('ADMIN_API_URL').replace(/\/+$/, '');
  },
  /** Cookies are Secure everywhere except plain-http local development. */
  get secureCookies(): boolean {
    return process.env.NODE_ENV === 'production';
  },
};
