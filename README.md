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

## What it shows

- Total income / total expenses / balance
- Recent transactions list

The active organization is selected after authentication and sent to the API as
the `x-org-id` header. It is never configured as a public environment variable.
