# Frontend (Next.js + React)

## Run locally

```bash
cd expense-control-frontend
npm install
npm run dev
```

- Frontend runs at: `http://localhost:3000`

## Environment variables

Copy `.env.example` to `.env.local`:

- `NEXT_PUBLIC_API_BASE_URL` (defaults to `http://localhost:3001`)

## Authentication and workspace selection

The frontend signs users in with Supabase email/password authentication through
the backend auth routes. Email-confirmation links finish in `/auth/callback`,
password-recovery links finish in `/auth/reset-password`, and both flows keep
using the existing local session token plus `cf_org_id` workspace selection.

First-time users are sent through a short "Preparing your personal workspace"
screen. Existing users reuse one of their current organizations without seeing
the old required business-name form.

The active organization is sent to the API as the `x-org-id` header. It is
never configured as a public environment variable.
