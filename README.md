# RiSips Admin Portal

Admin console for the RiSips mutual fund distribution platform — centralised control,
compliance oversight and operational visibility for the MFD business.

Sign-in, the dashboard, the investor screens, transaction monitoring, reports, support
tickets, the live chat (Risip Bot), compliance alerts, announcements and staff management run on the live RiSips API. Agents
and Buckets show a "coming soon" page until the platform has that data. The remaining
screens (model portfolios, meetings, the staff inbox) are still UI on typed mock data
in `src/data/`.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 · lucide-react.
Charts are hand-rolled SVG — no charting dependency.

## Running it

```bash
cp .env.example .env.local   # ADMIN_API_URL=http://localhost:3000
bun install
bun run dev
```

Start the API first (`backend/`, `bun run dev`), then open http://localhost:3100. Create a
staff account from `backend/` with `bun run staff:create`, or use the seeded dev account;
staff sign in with email and password (an authenticator step can be turned on with the API's
`STAFF_MFA_ENABLED=true`). `bun run typecheck` and `bun run build` both need to stay
clean before a push.

## Screens

| Route | What it does |
| --- | --- |
| `/signin` | Email + password; TOTP (`/signin/mfa`) only when the API has `STAFF_MFA_ENABLED=true`; forced password change at `/signin/password` |
| `/dashboard` | Live: signups, KYC status and funnel, stuck investors, investments |
| `/investors`, `/investors/[id]` | Live: filterable investor list and the full record (KYC, bank, SIPs, orders, timeline) |
| `/reports`, `/reports/[key]` | Live: six reports (investors, KYC, transactions, plans, payments, AUM) with filters, an on-screen preview and CSV download (`/reports/[key]/export`, audited by the API) |
| `/staff`, `/staff/new`, `/staff/[id]` | Live: staff accounts, roles, suspend / reactivate / deactivate, password and 2FA resets, sign-in history |
| `/agents`, `/buckets` | Coming soon |
| `/model-portfolios` | Curated baskets per risk profile, plus the five-step create/edit wizard |
| `/compliance`, `/compliance/[id]` | Live: alerts the API's checks raise every 10 minutes (stalled/failed KYC, SIP failure streaks, rejected or unauthorised mandates, paid-but-unallotted and stuck orders, missing nominees). Acknowledge, assign, resolve or dismiss with a note, remind the investor, full history; alerts clear themselves when the condition goes |
| `/review-meetings` | Meeting log and note capture that drives profile changes |
| `/transactions` | Live: every order across investors, flagged when failed, paid-but-unconfirmed, unsubmitted, stuck at the RTA or waiting on the investor; refresh one from FP (audited) |
| `/support`, `/support/new`, `/support/[id]` | Live: support tickets with SLA, assignee, internal notes and history; staff log phone and email requests; the investor is notified of replies |
| `/announcements`, `/announcements/new`, `/announcements/[id]` | Live: offers, updates and notices to investors as an in-app notification and/or the app's home banner + pop-up. Audience rules, maker-checker approval, schedule; promotional ones skip opt-outs, wait out 21:00–08:00 and cap at 2 a week. Delivery, open and tap counts |
| `/risip-bot` | Live: in-app chats with Ri. Take over any chat (or just reply) to answer as a person, hand it back to Ri, close it, or turn it into a ticket. Re-renders every 4 s while open |

## How auth works

The browser never talks to the API and never holds a token.

```
browser ──cookie──▶ Next server (server components, server actions) ──Bearer──▶ RiSips API
```

- The staff session token lives only in an httpOnly, SameSite=Strict cookie
  (`__Host-` prefixed in production). Page scripts cannot read it.
- `src/middleware.ts` turns away requests with no cookie; every page then verifies the
  session with the API (`authedRequest`), which is the real check. An expired or revoked
  session goes through `/auth/expired`, which clears the cookie.
- Sign-in, MFA, password change and sign-out are server actions (`features/auth/actions.ts`);
  Next checks their Origin, so they cannot be triggered cross-site.
- Pages check a **permission** (`hasPermission('investors.read')`) and render a no-access
  state rather than failing. The sidebar hides what a role can't open (`permission` on a
  nav item), and `/` sends each person to the first page they can use. Every investor
  record view is audited by the API.
- The QR code for MFA enrolment is rendered on the server; `qrcode` never reaches the
  client bundle.

Only `ADMIN_API_URL` is needed, and it is server-side only. In production put the API's
`TRUST_PROXY` on this server's address so rate limits and the login log see real client IPs
(the client's `X-Forwarded-For` is passed on).

## Layout

```
src/
  app/          routes; (portal) holds the authenticated shell, signin/ the auth steps
  lib/          server-only: config, API client, session cookie and helpers
  components/   ui/ primitives, layout/ shell, charts/ SVG charts
  features/     one folder per domain, components + logic
  data/         mock data for the screens not yet on the API
  types/        domain types; admin-api.types.ts mirrors the API's responses
  utils/        formatting, class merging, badge tones
```

Server components do the data fetching, so the live pages ship almost no JavaScript; the
investor filters are a plain GET form and the URL is the filter state.

Dependency direction is one way: `app` → `features` → `components` → `utils`. Feature
folders never import from each other's internals.

## Brand

The mark is taken from the mobile app's construction figures
(`mobile-app/src/components/brand-mark.tsx`) rather than redrawn, and the blues match the
values the app draws its icons in, so the portal and the investor app read as one product.
