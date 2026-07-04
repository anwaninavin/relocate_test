# Pack with Me

Your all-in-one hostel survival kit — checklist, budget, notes, documents, emergency contacts, shopping recommendations, and a hostel survival guide, for students moving into a hostel for the first time. No passwords, no email, no forms — login is a mobile OTP.

## Tech stack

- **Next.js 15** (App Router) + **TypeScript** (strict)
- **TailwindCSS v4** + hand-built shadcn/ui-style primitives ([why "hand-built"](#a-note-on-shadcnui))
- **Framer Motion** for animation, **Lottie** for the packing-complete celebration
- **MongoDB Atlas** + **Mongoose**
- **NextAuth v5 (Auth.js)** — JWT sessions, Credentials provider
- **MSG91 OTP widget** — passwordless mobile OTP login (see [Authentication](#authentication))
- **WhatsApp Meta Cloud API** — admin broadcast messages only
- **Zod** + **React Hook Form**
- **PWA** (installable, offline fallback) via `@ducanh2912/next-pwa`
- Dark/light theme via `next-themes`

## Authentication

Login is a mobile OTP, verified client-side by the MSG91 widget and then confirmed server-side before a session is issued:

1. You type your mobile number and hit **Send OTP**. The MSG91 widget (loaded client-side) sends the OTP directly.
2. You type the OTP you received by SMS and hit **Verify OTP**. The widget verifies it and returns a short-lived JWT access token to the browser.
3. The app hands that access token to NextAuth, which calls MSG91's `verifyAccessToken` API server-side (using the account's secret authkey — never exposed to the browser) to confirm it's genuine and extract the verified mobile number.
4. On success, a session is issued — auto-creating the account on first login. No separate registration form, no password, no email, no forgot-password flow.
5. First-time users complete a one-step profile (name, college, hostel, room) before reaching the dashboard.

An admin-issued mobile + 7-digit login code is also available as a fallback (see "Have a login code instead?" on the login screen) — this doesn't involve MSG91 at all.

## Project structure

```
app/                  Routes (App Router). (auth) and (dashboard) are route groups.
components/ui/        Hand-built shadcn/ui-style primitives (button, card, dialog, form, ...)
components/shared/    Reusable app components (navbar, sidebar, empty states, progress ring, ...)
features/<name>/      Client-side view components + form dialogs, one folder per feature
actions/              Server Actions ("use server") — validate with Zod, call services/, revalidate
services/             Data access layer — the only place that talks to Mongoose models directly
models/               Mongoose schemas
lib/                  Auth config, DB connection, MSG91/WhatsApp clients, validations, utilities
types/                Shared TypeScript types + enums (checklist categories, etc.)
scripts/              seed.ts (starter content), make-admin.ts, generate-icons.ts
```

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. MongoDB Atlas setup

1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Database Access → add a database user with a strong password.
3. Network Access → add your IP (or `0.0.0.0/0` for quick testing — restrict this for production).
4. Get your connection string (Connect → Drivers) and put it in `MONGODB_URI` — include a database name at the end, e.g. `.../Hostel?retryWrites=true`.

### 3. MSG91 OTP setup

1. Create an account at [msg91.com](https://msg91.com/) and note your account **Auth Key** (`MSG91_AUTH_KEY`, under Settings → API) — keep this secret, server-side only.
2. Under OTP → Widgets, create a new OTP widget. Note its **Widget ID** (`NEXT_PUBLIC_MSG91_WIDGET_ID`) and **Token Auth** (`NEXT_PUBLIC_MSG91_TOKEN_AUTH`) — these are safe to expose client-side; they only allow *sending* OTPs, not verifying them server-side.
3. No webhook or public URL is required — the widget talks to MSG91 directly from the browser, and this app verifies the resulting token server-side via MSG91's API.

### 4. Meta WhatsApp Cloud API setup (optional — admin broadcast only)

Only needed if you plan to use the admin Broadcast composer to message users on WhatsApp. Login does not depend on this.

1. Create an app at [developers.facebook.com](https://developers.facebook.com/) → add the **WhatsApp** product.
2. Under WhatsApp → API Setup, note your **Phone number ID** (`META_PHONE_NUMBER_ID`) and generate a permanent **access token** (`META_ACCESS_TOKEN`) — a System User token is recommended over the 24h test token.

### 5. Environment variables

Copy `.env.example` to `.env.local` and fill in the values from steps 2-4, plus a generated `NEXTAUTH_SECRET`:

```bash
cp .env.example .env.local
openssl rand -base64 32   # paste the output as NEXTAUTH_SECRET
```

### 6. Seed starter content (optional but recommended)

Populates real starter content for the Shopping and Hostel Guide sections:

```bash
npm run seed
```

### 7. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The MSG91 widget works from localhost, so full login testing works without deploying first.

### 8. Make yourself an admin

The first user must log in once (via the normal OTP flow) to create their account, then be promoted:

```bash
npm run make-admin -- 9876543210
```

This unlocks `/admin` (analytics, user list, product/guide content management, WhatsApp broadcast).

## Deploying to Vercel

1. Push this repo to GitHub and import it in [Vercel](https://vercel.com/new).
2. In the Vercel project's **Settings → Environment Variables**, add every variable from `.env.example`:
   `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (set this to your production URL, e.g. `https://your-app.vercel.app`), `NEXT_PUBLIC_MSG91_WIDGET_ID`, `NEXT_PUBLIC_MSG91_TOKEN_AUTH`, `MSG91_AUTH_KEY`, and (if using broadcast) `META_PHONE_NUMBER_ID`, `META_ACCESS_TOKEN`.
   Missing any of these (especially `NEXTAUTH_SECRET` or `MONGODB_URI`) will cause every request to fail with `MIDDLEWARE_INVOCATION_FAILED`, since middleware initializes the auth session on every request.
3. In MongoDB Atlas → Network Access, allow Vercel's outbound IPs (or `0.0.0.0/0`) so the deployed app can connect.
4. Deploy.
5. Run `npm run seed` and `npm run make-admin -- <your-number>` locally (or from any machine) pointed at the same `MONGODB_URI` — these are one-off maintenance scripts, not part of the deployed app.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run start` | Run a production build locally |
| `npm run lint` | ESLint |
| `npm run seed` | Populate Shopping/Guide starter content |
| `npm run make-admin -- <mobile>` | Promote an existing user to admin |

## A note on shadcn/ui

This environment's network policy blocks the shadcn CLI's registry API (`ui.shadcn.com`), so the primitives in `components/ui/` were hand-written to match shadcn's standard "new-york" style, structure, and Radix UI + Tailwind conventions exactly. If you have registry access elsewhere, `npx shadcn@latest add <component>` will still work against this `components.json` and should produce compatible output.

## Known limitations of this build environment

Live MongoDB, MSG91, and Meta Graph API connectivity could not be verified from inside the sandboxed session this app was built in (raw MongoDB TCP, `control.msg91.com`, and `graph.facebook.com` are blocked by that environment's egress policy) — this is a sandbox restriction, not an application defect. Everything was verified via `tsc --noEmit`, `next lint`, and `next build` after every change, plus UI review. Live end-to-end testing (real OTP login, real database reads/writes) should be your first check after deploying or running locally with real credentials.
