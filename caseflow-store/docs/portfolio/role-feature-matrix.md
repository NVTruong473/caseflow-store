# Role And Feature Matrix

UI visibility is not the authorization boundary. Protected actions must pass
server-side session, role, ownership, payload, and policy checks.

| Capability | Anonymous | Customer | Staff | Admin | Server authority |
|---|---:|---:|---:|---:|---|
| Browse catalog and book details | Yes | Yes | Yes | Yes | Public RLS and active/sellable filters |
| Use local cart | Yes | Yes | Yes | Yes | Browser stores IDs/quantities only |
| Use isolated QR practice | No | Own session | No operational need | No operational need | Signed-in ownership, capability, expiry, amount, attempt limits |
| Submit official order | No | Own account | No | No | Profile readiness, trusted catalog reload, totals, voucher, stock, idempotency |
| View order history | No | Own orders | Operational orders | Operational orders | Customer ownership or operations role |
| Cancel eligible order | No | Own eligible order | Policy-based decision | Policy-based decision | State-transition and ownership/role policy |
| Track public order | Guarded lookup | Guarded lookup | Yes | Yes | Order code plus matching contact information |
| Read customer inbox | No | Own notifications | No | No | Customer ownership |
| View operations dashboard | No | No | Yes | Yes | Staff/admin role |
| Process routine order status | No | No | Yes | Yes | Allowed transition policy |
| Reject risky order | No | No | Yes | Yes | Staff/admin role plus transition policy |
| Manage inventory | No | No | Yes | Yes | Validated adjustment and audit note |
| Manage catalog/content | No | No | Scoped operations | Yes | Role policy and validated DTO |
| Manage promotions | No | No | Read/scoped operations | Yes | Admin-only elevated mutations |
| Manage customers | No | Own profile only | Minimized operational view | Yes | Role policy and minimized fields |
| Manage provider/settings readiness | No | No | Limited/read-only | Yes | Admin-only |
| Change customer password | No | Own account | N/A | N/A | Supabase email recovery flow |
| Change staff/admin password | No | No | Own account plus operations key | Own account plus operations key | Server-only key comparison and Auth session |
| Decide prices, totals, stock, role, or status | Never | Never | Never from browser | Never from browser | Server/repository/database only |

## Data Exposure Rules

- Customer screens do not expose demo catalog counters, staff notes, provider
  readiness, internal risk notes, or other customers' data.
- Staff/admin views receive only fields needed for the operation.
- Service-role credentials stay in server-only code and environment variables.
- Portfolio media uses generated test identity data and contains no credential,
  email address, phone number, or shipping address from a real customer.
