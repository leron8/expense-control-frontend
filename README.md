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

After Magic Link authentication, the frontend finishes the session in
`/auth/callback`, lets the backend guarantee a workspace for the caller, and
stores the active organization in local storage as `cf_org_id`.

First-time users are sent through a short "Preparing your personal workspace"
screen. Existing users reuse one of their current organizations without seeing
the old required business-name form.

The active organization is sent to the API as the `x-org-id` header. It is
never configured as a public environment variable.
