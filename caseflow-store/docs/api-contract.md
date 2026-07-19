# API Contract

CaseFlow Store Route Handlers return one JSON envelope shape:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request"
  },
  "meta": null
}
```

Successful responses set `error` to `null`. Failed responses set `data` and
`meta` to `null`. Clients may branch on `error.code`; English error messages
are display text and are not a stable machine contract.

## Stable Error Codes

| Code | HTTP | Meaning |
|---|---:|---|
| `VALIDATION_ERROR` | 400 | JSON, route parameter, query, or request body is invalid |
| `UNAUTHORIZED` | 401 | A valid authenticated session is missing |
| `FORBIDDEN` | 403 | The authenticated user does not have the required role |
| `BOOK_EDITION_NOT_FOUND` | 404 | A requested active book edition does not exist |
| `PRODUCT_NOT_FOUND` | 404 | A requested active product or cart product does not exist |
| `ORDER_NOT_FOUND` | 404 | The requested order does not exist or the supplied order lookup contact does not match |
| `OUT_OF_STOCK` | 409 | Requested quantity exceeds current stock |
| `ORDER_INVALID_TRANSITION` | 409 | Admin order, payment, or shipping status transition is not allowed |
| `PAYMENT_ALREADY_PAID` | 409 | The order already has a paid payment state |
| `PAYMENT_DISABLED` | 403/404 | QR demo payment or mock simulation is disabled in the current environment |
| `PAYMENT_EXPIRED` | 409 | The payment session has expired and cannot be completed |
| `PAYMENT_INVALID_SIGNATURE` | 401 | Mock payment webhook signature failed HMAC verification |
| `PAYMENT_INVALID_STATE` | 409 | Payment/order/provider state transition is not allowed |
| `PAYMENT_NOT_FOUND` | 404 | Payment does not exist or does not belong to the authenticated customer |
| `PAYMENT_READ_FAILED` | 500 | Payment persistence read failed |
| `PAYMENT_WRITE_FAILED` | 500 | Payment persistence write failed |
| `CUSTOMER_AUTH_FAILED` | 400/429 | Customer sign-up could not be completed or is temporarily rate-limited |
| `CATALOG_READ_FAILED` | 500 | Catalog persistence read failed |
| `CART_VALIDATION_FAILED` | 500 | Cart validation could not read current catalog data |
| `ORDER_CREATE_FAILED` | 500 | Trusted order persistence failed |
| `ORDER_READ_FAILED` | 500 | Admin order retrieval failed |
| `ORDER_UPDATE_FAILED` | 500 | Admin order operations persistence failed |
| `SIGN_OUT_FAILED` | 500 | The authenticated session could not be cleared |
| `CUSTOMER_PROFILE_UNAVAILABLE` | 503 | Customer profile persistence or lookup failed |
| `ADMIN_AUTH_UNAVAILABLE` | 503 | The admin profile authorization dependency failed |

The compile-time source of truth is `src/lib/api/error-codes.ts`. Adding,
renaming, or removing a code changes the public API contract and requires an
explicit compatibility review.

## Public Order Tracking

`POST /api/orders/track` supports public order tracking with a guarded lookup.

Request body:

```json
{
  "orderCode": "CF-...",
  "contact": "customer@example.com"
}
```

`contact` may be the customer email or phone number used at checkout. The API
normalizes order code casing, email casing, and common Vietnam phone formatting.

Successful responses return only tracking-safe order data:

```json
{
  "data": {
    "orderCode": "CF-...",
    "status": "pending",
    "paymentMethod": "bank-transfer",
    "paymentStatus": "awaiting-transfer",
    "shippingMethod": "standard",
    "totalVnd": 182300,
    "itemCount": 1,
    "createdAt": "2026-07-16T00:00:00.000Z",
    "updatedAt": "2026-07-16T00:00:00.000Z"
  },
  "error": null,
  "meta": {
    "resource": "public-order-tracking"
  }
}
```

The response must not expose customer email, phone, shipping address, or item
details. Missing orders and wrong-contact lookups both return the same
`ORDER_NOT_FOUND` response so the endpoint does not reveal whether another
customer's order code exists.

## QR Demo Payments

QR payment endpoints require an authenticated customer session unless noted
otherwise. They do not accept browser-owned amounts. The backend reloads the
customer-owned order and uses the stored `orders.total_vnd`.

### `POST /api/payments`

Creates or resumes a QR payment session for the customer's order.

Request body:

```json
{
  "orderId": "CF-...",
  "provider": "DEMO_VIETQR"
}
```

`provider` may be `MOCK_GATEWAY` or `DEMO_VIETQR`.

Successful responses return a payment session:

```json
{
  "data": {
    "paymentId": "pay_...",
    "orderId": "CF-...",
    "amount": 182300,
    "currency": "VND",
    "status": "PENDING",
    "provider": "DEMO_VIETQR",
    "qrPayload": "000201...",
    "paymentReference": "CFPAY-CF-...",
    "paymentContent": "CF-...",
    "expiresAt": "2026-07-19T00:00:00.000Z",
    "serverTime": "2026-07-19T00:00:00.000Z",
    "allowSimulation": true,
    "merchant": {
      "name": "CaseFlow Books",
      "accountName": "CASEFLOW BOOKS DEMO",
      "bankName": "Vietcombank - DEMO",
      "bankBin": "970436",
      "accountNumber": "0000000000"
    },
    "order": {
      "orderCode": "CF-...",
      "status": "pending",
      "paymentStatus": "awaiting-transfer"
    }
  },
  "error": null,
  "meta": null
}
```

When running in production, QR demo payment creation is denied by server-side
environment checks.

### `GET /api/payments/[paymentId]`

Returns the latest customer-owned payment session and refreshes expired pending
payments on the server. Cross-customer payment IDs return `PAYMENT_NOT_FOUND`.

### `POST /api/dev/payments/[paymentId]/simulate-success`

Development/sandbox-only endpoint. It is disabled when `NODE_ENV=production`
or `ENABLE_MOCK_PAYMENT=false`. When enabled, it creates a signed mock webhook
payload and routes the update through the shared webhook/payment service.

### `POST /api/webhooks/mock-payment`

Server webhook endpoint for the mock gateway. The request body must be signed
with `x-caseflow-signature` or `x-mock-payment-signature` using the configured
HMAC secret. Repeated paid webhooks are idempotent: they return success without
recording payment twice.

## Admin/Staff Role Permissions

Admin workspace endpoints use server-side role and permission checks:

| Endpoint | Required permission | Staff | Admin |
|---|---|---:|---:|
| `GET /api/admin/dashboard` | `orders:read` | Yes | Yes |
| `GET /api/admin/exports/orders` | `orders:read` | Yes | Yes |
| `GET /api/admin/orders` | `orders:read` | Yes | Yes |
| `PATCH /api/admin/orders/[id]` | `orders:update-status` | Yes | Yes |
| `GET /api/admin/settings` | `settings:manage` | No | Yes |

Anonymous callers receive `UNAUTHORIZED`. Authenticated customers or roles
without the required permission receive `FORBIDDEN`.

`GET /api/admin/orders` supports optional `q`, `status`, `paymentStatus`, and
`shippingStatus` filters. `PATCH /api/admin/orders/[id]` updates order status,
payment status, shipping status, and internal notes, but invalid transitions
return `ORDER_INVALID_TRANSITION`.

`GET /api/admin/exports/orders` supports the same dashboard date-window query
shape: `range=7d|30d|all` or paired `from=YYYY-MM-DD&to=YYYY-MM-DD`. It returns
server-generated `text/csv` for order operations. The CSV intentionally excludes
customer email, phone, full shipping address, customer id, and internal notes.
