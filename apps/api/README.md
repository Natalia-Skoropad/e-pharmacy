# E-PHARMACY API

Shared Express/MongoDB backend API for the E-PHARMACY monorepo. It supports the client storefront and provides the backend foundation for future pharmacy and admin modules.

## Current Status

Implemented:

- Client auth and profile flow
- Password recovery through email
- Products and stores catalogs
- Product and store details
- Reviews and favorites
- Cart
- Checkout and persisted orders
- Shared validation, middleware, controller, service, and model structure

Planned:

- Pharmacy shop management
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

### Stores

- Store catalog
- Store filters
- Store details
- Store reviews
- Authenticated store review creation
- Favorite store toggle

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
- Rate limiting
- Helmet
- CORS allowlist
- Origin/Referer validation for non-safe cookie-based mutations
- MongoDB duplicate error normalization

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
- express-rate-limit
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
POST  /auth/register
POST  /auth/login
POST  /auth/forgot-password
POST  /auth/request-reset-email
POST  /auth/reset-password
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

### Stores

```txt
GET   /stores
GET   /stores/filters
GET   /stores/:storeId
GET   /stores/:storeId/reviews
POST  /stores/:storeId/reviews
PATCH /stores/:storeId/favorite
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

CLIENT_ORIGINS=http://localhost:3000
CLIENT_APP_URL=http://localhost:3000

SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=<your-smtp-user>
SMTP_PASSWORD=<your-smtp-password>
SMTP_FROM="E-PHARMACY <no-reply@your-domain.com>"

AUTH_COOKIE_DOMAIN=
AUTH_COOKIE_SAME_SITE=lax
```

For the current Vercel client + Render API setup through the Next.js BFF, `AUTH_COOKIE_SAME_SITE=lax` is the preferred default.

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
- Configure `CLIENT_ORIGINS` and `CLIENT_APP_URL`
- Choose cookie settings for the deployment model
- Verify CORS and Origin/Referer validation
- Verify password reset links
- Verify checkout and order creation
