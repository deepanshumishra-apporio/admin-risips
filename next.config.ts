import type { NextConfig } from 'next';

/**
 * Headers for a portal that shows personal financial data. A full script CSP
 * needs per-request nonces; these directives are the ones that cost nothing
 * and close clickjacking, base-tag injection and form hijacking.
 */
const SecurityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  ...(process.env.NODE_ENV === 'production'
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }]
    : []),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    // Sub-admins became Staff, backed by the API.
    return [{ source: '/sub-admins', destination: '/staff', permanent: true }];
  },
  async headers() {
    return [{ source: '/:path*', headers: SecurityHeaders }];
  },
};

export default nextConfig;
