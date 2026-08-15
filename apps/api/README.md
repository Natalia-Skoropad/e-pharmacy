# E-PHARMACY API

Shared Express/MongoDB backend API for the E-PHARMACY monorepo. It supports the client storefront and provides the backend foundation for future pharmacy and admin modules.

## Current Status

Implemented:

- Client auth and profile flow
- Password recovery through email
- Products and pharmacies catalogs
- Product and pharmacy details
- Reviews and favorites
- Cart
- Checkout and persisted orders
- Shared validation, middleware, controller, service, and model structure

Planned:

- Pharmacy management
- Pharmacy product CRUD
- Pharmacy statistics and client goods data
- Admin dashboard statistics
- Admin products, orders, clients, and suppliers management

The API is currently client-ready. Pharmacy and admin modules are planned extensions.

## Features

### Auth and users

- Register client
- Login/logout
- Current user endpoint
- Profile update
- Password update
- Password reset request
- Password reset with email token
- JWT auth with backend-managed httpOnly cookies
- Role middleware foundation

### Pharmacies

- Pharmacy catalog
- Pharmacy filters
- Pharmacy details
- Pharmacy reviews
- Authenticated pharmacy review creation
- Favorite pharmacy toggle

### Products

- Product catalog
- Product filters
- Product details
- Product reviews
- Authenticated product review creation
- Favorite product toggle
- Admin-role review moderation route foundation

### Cart and orders

- Authenticated cart access
- Add, update, remove, and clear cart items
- Reservation-aware stock handling
- Checkout endpoint
- Order history
- Single order details
- MongoDB order persistence

### API quality and safety

- Zod request validation
- Centralized error handling
- Not-found middleware
- Controller wrapper utility
- Distributed Mongo-backed auth rate limiting and progressive delays
- Helmet
- CORS allowlist
- Origin/Referer validation for non-safe cookie-based mutations
- MongoDB duplicate error normalization

### Auth abuse protection

Credential-sensitive auth limits use Mongo fixed-window counters with TTL rather
than process-local memory. Replicas therefore share the same IP/account/token
budgets, and process restarts do not reset the active window. Raw e-mail, IP,
user-id and reset-token values are not stored as bucket identifiers; the store
uses one-way SHA-256 bucket ids. Progressive delay counters use the same shared
store.

Public pharmacy registration documents require a one-hour upload session. A
session is limited to six documents and 30 MB total; only the upload-session
token hash is stored. Individual unclaimed documents keep their existing TTL.

## Tech Stack

- Node.js
- Express
- TypeScript
- MongoDB
- Mongoose
- Zod
- jsonwebtoken
- bcryptjs
- helmet
- cors
- Nodemailer
- Handlebars
- pnpm workspaces
- Turborepo

## Project Structure

```txt
apps/api/
  src/
    config/
    constants/
    controllers/
    db/
    middlewares/
    models/
    routes/
    schemas/
    scripts/
    services/
    templates/
    types/
    utils/
    app.ts
    server.ts
```

## API Areas

### Health

```txt
GET  /health
POST /health/echo
```

### Auth

```txt
POST  /auth/pharmacy-documents/session
POST  /auth/pharmacy-documents
POST  /auth/register
POST  /auth/login
POST  /auth/password-reset/request
POST  /auth/password-reset/confirm
GET   /auth/current
PATCH /auth/current
PATCH /auth/current/password
POST  /auth/logout
```

Development-only role test routes are available outside production:

```txt
GET /auth/test/client
GET /auth/test/pharmacy
GET /auth/test/admin
```

### Pharmacies

```txt
GET   /pharmacies
GET   /pharmacies/filters
GET   /pharmacies/:pharmacyId
GET   /pharmacies/:pharmacyId/reviews
POST  /pharmacies/:pharmacyId/reviews
PATCH /pharmacies/:pharmacyId/favorite
```

### Products

```txt
GET   /products
GET   /products/filters
GET   /products/:productId
GET   /products/:productId/reviews
POST  /products/:productId/reviews
PATCH /products/:productId/reviews/:reviewId/moderation
PATCH /products/:productId/favorite
```

### Cart

```txt
GET    /cart
POST   /cart/items
PATCH  /cart/items/:cartItemId
DELETE /cart/items/:cartItemId
DELETE /cart/clear
```

### Orders

```txt
POST /orders/checkout
GET  /orders
GET  /orders/:orderId
```

## Frontend ↔ Backend Flow

The client client uses this API through two paths:

```txt
Public/server data -> Express API -> MongoDB
Browser private flow -> Next.js same-origin /api/* route handlers -> Express API -> MongoDB
```

The API remains the real authorization boundary. Private data is protected by backend `authenticate` middleware and httpOnly auth cookies.

## Cart / Order Notes

Cart and checkout are backend-driven, not just local frontend state.

The current flow tracks active and reserved product quantities:

- Adding an item can reserve available stock
- Removing an item releases the reservation
- Expired cart items can release reserved stock
- Checkout converts reserved items into confirmed order data
- Orders are persisted in MongoDB with client and delivery details

## API Response Contract

Successful responses use:

```json
{
  "status": "success",
  "message": "Optional success message",
  "data": {}
}
```

Error responses use:

```json
{
  "status": "error",
  "message": "Error message",
  "details": {}
}
```

Validation errors can include field-level details. Production errors hide stack traces.

## Environment Variables

Create `apps/api/.env` using `apps/api/.env.example`.

```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/e-pharmacy?retryWrites=true&w=majority

JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
JWT_RESET_EXPIRES_IN=15m

CLIENT_APP_URL=http://localhost:3000
PHARMACY_APP_URL=http://localhost:3002
ADMIN_APP_URL=http://localhost:3001
TRUSTED_APP_ORIGINS=

SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=<your-smtp-user>
SMTP_PASSWORD=<your-smtp-password>
SMTP_FROM="E-PHARMACY <no-reply@your-domain.com>"

AUTH_COOKIE_DOMAIN=
AUTH_COOKIE_SAME_SITE=lax
```

For the current Vercel client + Render API setup through the Next.js BFF, `AUTH_COOKIE_SAME_SITE=lax` is the preferred default.

CORS and mutation Origin/Referer validation use the same startup-derived trusted-origin set. The set always includes the configured client, pharmacy, and admin application URLs. `TRUSTED_APP_ORIGINS` adds explicit extra origins; invalid, credentialed, or non-HTTP(S) values fail startup validation. `CLIENT_ORIGINS` and the older CORS/frontend variables remain migration aliases when `TRUSTED_APP_ORIGINS` is not set.

## Run Locally

From the monorepo root:

```bash
pnpm install
pnpm seed:api
pnpm dev:api
```

Health check:

```txt
http://localhost:4000/health
```

## Scripts

From the monorepo root:

```bash
pnpm dev:api
pnpm seed:api
pnpm build:api
pnpm type-check:api
pnpm check:api
```

From `apps/api`:

```bash
pnpm dev
pnpm seed
pnpm build
pnpm start
pnpm type-check
pnpm lint
```

## Deployment Notes

Before deploying:

```bash
pnpm check:api
```

Production checklist:

- Set `MONGODB_URI`
- Set a strong `JWT_SECRET`
- Configure SMTP credentials
- Configure `CLIENT_APP_URL`, `PHARMACY_APP_URL`, and `ADMIN_APP_URL` for every deployed application; their origins are trusted automatically
- Use `TRUSTED_APP_ORIGINS` only for additional explicit origins such as preview deployments
- Choose cookie settings for the deployment model
- Verify CORS and Origin/Referer validation
- Verify password reset links
- Verify checkout and order creation

## Domain invariants

### Stock

`ProductOffer` is the only Stock owner. It stores `totalQuantity`, `availableQuantity`, and `reservedQuantity`, where `totalQuantity === availableQuantity + reservedQuantity`. Only `stock.service.ts` may mutate these values. `inStock` is derived from `availableQuantity > 0` and is not persisted on ProductOffer.

### Cart

A Cart belongs to `clientUserId`, may contain ProductOffers from several pharmacies, and contains each ProductOffer at most once. One pharmacy group creates one Order. `MAX_PHARMACY_GROUPS_PER_CART` is 15 to prevent one checkout flow from producing an excessive number of independent orders. Expired reservations are released by the scheduled cleanup job.

Cart prices are live ProductOffer prices. The immutable price snapshot is created only during Order checkout.

### Order

Allowed transitions are `new -> in_progress | rejected` and `in_progress -> successful | rejected`. Successful and rejected Orders are terminal. Stock remains reserved until a terminal transition: `successful` commits it, while `rejected` releases it. Rejection metadata and status history are stored with the Order.

### Canonical shared names

Use only `PaymentMethod`, `DeliveryMethod`, `postal_delivery`, `ProductCategory`, and `PRODUCT_CATEGORIES`.


## Trusted BFF authentication response

For a request carrying the validated BFF marker and shared secret, login, registration and refresh responses include a server-only token block:

```ts
tokens: {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
}
```

Both expiry fields are integer seconds derived from `JWT_EXPIRES_IN` and `REFRESH_TOKEN_EXPIRES_IN`. The Next.js BFF removes this block from the browser response and uses the expiry metadata as the browser cookie `Max-Age`. Direct browser responses never receive the raw token block.
