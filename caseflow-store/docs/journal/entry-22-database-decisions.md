# Entry 22 - Database Decisions

Type: retrospective note, not an additional development day.

## What Held Up

The relational model was a good fit for categories, products, orders, order items, and profiles. Storing order-item snapshots was important because product names and prices can change after purchase.

The decision not to create a cart table kept the MVP focused. Cart state remained local and untrusted, while checkout and order creation recalculated product data on the server.

RLS deny-by-default behavior was valuable. Public users could read active catalog data but could not directly read or write order tables.

## What Was Incomplete

Stock decrement was not implemented as a full inventory system. The project validates stock before order creation, but the known limitation is documented rather than hidden.

The schema worked for phone accessories but would need a new model for books. A bookstore pivot should introduce book works, editions, authors, translations, publishers, ISBNs, language, format, and inventory movements.

## Portfolio Takeaway

The database story is credible because it records both the implemented controls and the missing inventory depth.
