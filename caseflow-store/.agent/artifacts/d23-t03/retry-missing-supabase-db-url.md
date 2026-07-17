# D23-T03 Retry Evidence - Missing Supabase DB URL

- Date: 2026-07-16
- Task: `D23-T03 - Apply And Verify Book Schema In Supabase`
- Status: blocked before backup/export and before SQL apply

## Result

The retry was stopped because `caseflow-store/.env.local` still does not
contain an exact `SUPABASE_DB_URL` key.

The file exists and contains Supabase public/service keys plus local project
settings, but the PostgreSQL database URL required for `supabase db dump`,
schema export, data export, pre-migration SQL checks, and migration apply is
not present.

## Guardrails Preserved

- No secret values were printed.
- No backup/export command was run.
- No migration SQL was applied.
- No destructive database operation was performed.

## Required Unblock

Add this exact key to `caseflow-store/.env.local`, save the file, then retry:

```text
SUPABASE_DB_URL=postgresql://postgres:<password>@db.fcsuldrerhbynwotcvyn.supabase.co:5432/postgres
```

If the password contains special URL characters such as `#`, `@`, `%`, `/`,
`?`, `&`, `[`, or `]`, use the URL-encoded connection string copied directly
from Supabase Dashboard instead of hand-typing it.
