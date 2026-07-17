# D23-T03 Backup Manifest

- Created: 2026-07-16T05:45:38.814Z
- Environment: Supabase production project `caseflow-store` (`fcsuldrerhbynwotcvyn`)
- Export method: direct PostgreSQL metadata/data export using a temporary JS PostgreSQL client
- Export scope: `public` schema only
- Auth schema: intentionally excluded because D23-T03 does not alter auth tables and local auth exports can contain sensitive login/session data
- Schema export: `.agent/artifacts/d23-t03-backup/schema-before-v1-1.sql` (15207 bytes)
- Data export: `.agent/artifacts/d23-t03-backup/data-before-v1-1.sql` (13506 bytes, 22 public rows across 5 tables)
- Checksums: `.agent/artifacts/d23-t03-backup/checksums.sha256`
- Secret handling: database URL, password, anon key, and service-role key were not printed into artifacts

## Table Counts

| Table | Rows |
|---|---:|
| `public.categories` | 5 |
| `public.order_items` | 0 |
| `public.orders` | 0 |
| `public.products` | 16 |
| `public.profiles` | 1 |

## Tooling Note

Supabase CLI dump was attempted first but stopped because this local environment lacks Docker Desktop, which the CLI requires for dump execution here. The migration apply path uses the verified direct PostgreSQL connection instead.
