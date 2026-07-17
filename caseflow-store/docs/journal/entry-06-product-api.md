# Entry 06 - Product API

Type: real implementation journal entry.

## Goal

Expose product and category data through validated API routes before connecting the database.

## Work Completed

The product API started with the mock repository. `GET /api/products` supported category, compatibility, search, featured, and basic sorting query parameters. `GET /api/products/[slug]` returned product detail data and handled invalid or missing slugs. `GET /api/categories` returned active category data.

`POST /api/cart/validate` was added as the first critical trust boundary. It accepted only product IDs and quantities, aggregated duplicate products, read current product data, checked stock, and recalculated line totals and subtotal on the server.

## Evidence

- Product list, detail, and category APIs were implemented.
- Cart validation returned recalculated totals.
- Invalid product query, missing product, invalid JSON, invalid payload, and out-of-stock cases were tested with curl.
- `npm run lint`, `npx tsc --noEmit`, and `npm run build`: passed.

## Lesson

The cart validation route was more important than the product list route. It established the rule that the browser can describe intent, but the server owns price, stock, and totals.
