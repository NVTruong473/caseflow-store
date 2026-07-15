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
| `FORBIDDEN` | 403 | The authenticated user does not have the required admin role |
| `PRODUCT_NOT_FOUND` | 404 | A requested active product or cart product does not exist |
| `ORDER_NOT_FOUND` | 404 | The requested order does not exist |
| `OUT_OF_STOCK` | 409 | Requested quantity exceeds current stock |
| `CATALOG_READ_FAILED` | 500 | Product/category persistence read failed |
| `CART_VALIDATION_FAILED` | 500 | Cart validation could not read current catalog data |
| `ORDER_CREATE_FAILED` | 500 | Trusted order persistence failed |
| `ORDER_READ_FAILED` | 500 | Admin order retrieval failed |
| `ORDER_UPDATE_FAILED` | 500 | Admin order status persistence failed |
| `SIGN_OUT_FAILED` | 500 | The authenticated session could not be cleared |
| `ADMIN_AUTH_UNAVAILABLE` | 503 | The admin profile authorization dependency failed |

The compile-time source of truth is `src/lib/api/error-codes.ts`. Adding,
renaming, or removing a code changes the public API contract and requires an
explicit compatibility review.
