# E-PHARMACY API

> A shared Express/MongoDB backend API for the E-PHARMACY portfolio release and future ecosystem expansion.

## Overview

**E-PHARMACY API** is the single shared backend for the E-PHARMACY monorepo.

It currently supports the completed customer storefront and is designed to be extended with vendor and admin modules in later stages. The current portfolio release should be reviewed as a customer-ready API foundation, not as a completed vendor/admin backend.

The API provides:

- customer authentication and authorization foundation
- user profile management
- password recovery through email
- pharmacy stores catalog data
- medicines catalog data
- product and pharmacy reviews
- product and pharmacy favorites
- cart management
- checkout and order persistence
- role-based middleware foundation for future customer, vendor, and admin flows

> Current status: ready for the customer client release. Vendor and admin backend features are planned future modules that should extend this same API instead of becoming separate duplicated backends.

## Current Release Boundary

Current portfolio release includes:

- customer auth/profile/password recovery
- public stores and products data
- reviews and favorites for customer-facing entities
- cart and checkout
- persisted customer orders
- shared middleware/service/controller architecture

Planned only:

- vendor shop management
- vendor medicine CRUD
- vendor statistics and client goods workflows
- admin dashboard statistics
- admin products/orders/customers/suppliers management

## Ecosystem Role

```txt
apps/client  -> completed customer storefront
apps/vendor  -> planned pharmacy/vendor cabinet roadmap only
apps/admin   -> planned admin dashboard roadmap only
apps/api     -> one shared backend API foundation
```

The backend is intentionally shared because all apps work with the same domain data: users, roles, pharmacies, products, carts, orders, suppliers, customers, statistics, and moderation flows.

Future vendor and admin development should extend this API with additional modules rather than create separate backend copies.

## Features

### Authentication and users

- user registration
- user login
- current user endpoint
- logout
- profile update
- password update
- password reset request
- password reset through email token
- JWT-based authentication
- httpOnly auth cookie helper utilities
- role-based middleware foundation

### Password recovery

- reset email request endpoint
- rate limiting for password reset actions
- reset token validation
- email template support
- SMTP integration through Nodemailer

### Stores

- pharmacy stores catalog
- filters for stores
- store details
- store reviews
- authenticated store review creation
- favorite store toggle

### Products

- medicines catalog
- product filters
- product details
- product reviews
- authenticated product review creation
- favorite product toggle
- admin-role moderation route foundation for future moderation workflows

### Cart

- authenticated cart access
- add item to cart
- update item quantity
- remove item from cart
- clear cart
- server-side cart model

### Orders

- checkout endpoint
- authenticated order history
- single order details
- order persistence in MongoDB
- customer address and comment support for confirmed orders

### API quality and safety

- request validation with Zod
- centralized error handling
- not-found middleware
- controller wrapper utility
- rate limiting
- CORS configuration
- Helmet security middleware
- Origin/Referer validation for non-safe cookie-based mutations
- MongoDB duplicate error handling
- typed Express request extensions

## Tech Stack

### Backend

- **Node.js**
- **Express**
- **TypeScript**
- **MongoDB**
- **Mongoose**

### Authentication and security

- **jsonwebtoken**
- **bcryptjs**
- **helmet**
- **cors**
- **express-rate-limit**

### Validation and email

- **Zod**
- **Nodemailer**
- **Handlebars**

### Monorepo tooling

- **pnpm workspaces**
- **Turborepo**
- shared validation package for reusable validation constants and sanitizers

## Project Structure

```txt
apps/api/
  src/
    config/
      env.ts
    constants/
      auth.ts
      httpStatus.ts
      messages.ts
    controllers/
      auth.controller.ts
      cart.controller.ts
      health.controller.ts
      order.controller.ts
      product.controller.ts
      store.controller.ts
    db/
      connectDB.ts
    middlewares/
      auth.middleware.ts
      error.middleware.ts
      notFound.middleware.ts
      origin.middleware.ts
      rateLimit.middleware.ts
      role.middleware.ts
      validate.middleware.ts
    models/
      cart.model.ts
      order.model.ts
      product.model.ts
      store.model.ts
      user.model.ts
    routes/
      auth.routes.ts
      cart.routes.ts
      health.routes.ts
      index.ts
      order.routes.ts
      product.routes.ts
      store.routes.ts
    schemas/
      auth.schema.ts
      cart.schema.ts
      health.schema.ts
      order.schema.ts
      product.schema.ts
      store.schema.ts
    scripts/
      copy-templates.mjs
      seed.ts
    services/
      auth.service.ts
      cart.service.ts
      order.service.ts
      product.service.ts
      store.service.ts
    templates/
      reset-password-email.html
    types/
      auth.ts
      cart.ts
      errors.ts
      express.ts
      mongo.ts
      order.ts
      product.ts
      store.ts
      user.ts
    utils/
      apiResponse.ts
      authCookie.ts
      ctrlWrapper.ts
      formatZodError.ts
      httpError.ts
      jwt.ts
      logger.ts
      mongoError.ts
      password.ts
      passwordResetEmail.ts
      sendEmail.ts
      userResponse.ts
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

Temporary role-test routes are available only outside production:

```txt
GET /auth/test/customer
GET /auth/test/vendor
GET /auth/test/admin
```

These routes are intended for development checks and can be removed or moved when real customer, vendor, and admin modules are completed.

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

The completed customer storefront uses this API through two intentional paths:

```txt
Public/server data -> Express API -> MongoDB
Browser private flow -> Next.js same-origin /api/* route handlers -> Express API -> MongoDB
```

Public catalog, details, SEO metadata, sitemap, and read-only pages may be fetched from the API by Next.js server code.

Private customer flows go through the client BFF route handlers first. The browser calls same-origin `/api/*` routes on the Next.js app, then those handlers call this Express API and forward cookies/headers as needed.

The real authorization boundary remains the API:

- backend sets the httpOnly auth cookie
- backend `authenticate` middleware protects private data
- client-readable marker cookies are not treated as authorization
- Origin/Referer validation hardens cookie-based non-safe mutations

## Environment Variables

Create an `.env` file inside `apps/api`. The source of truth for API keys is `apps/api/.env.example`.

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

### Variable reference

| Variable | Used for | Notes |
| --- | --- | --- |
| `NODE_ENV` | runtime mode | `development` or `production` |
| `PORT` | API port | local default is `4000` |
| `MONGODB_URI` | MongoDB connection | required for API start and seed scripts |
| `JWT_SECRET` | signing auth/reset tokens | must be strong in production |
| `JWT_EXPIRES_IN` | auth token lifetime | current example: `7d` |
| `JWT_RESET_EXPIRES_IN` | password reset token lifetime | current example: `15m` |
| `CLIENT_ORIGINS` | allowed frontend origins for CORS and mutation Origin/Referer validation | comma-separated if more than one origin is needed |
| `CLIENT_APP_URL` | public client URL for password reset links and redirects | should match the deployed client domain |
| `SMTP_*` | password recovery email delivery | configured through the chosen SMTP provider |
| `AUTH_COOKIE_DOMAIN` | optional cookie domain | leave empty for separate Vercel + Render domains |
| `AUTH_COOKIE_SAME_SITE` | cookie same-site mode | `lax` for same-origin BFF flow; `none` only for intentional direct cross-site browser API calls |

For production, update MongoDB, JWT, SMTP, CORS, cookie, and client URL values.

When the client uses the Next.js BFF layer, browser mutations stay same-origin on the client domain and the BFF proxies them to this API. In that setup, `AUTH_COOKIE_SAME_SITE=lax` is preferred. Use `AUTH_COOKIE_SAME_SITE=none` only for intentional direct cross-site browser calls to the API.

Current deployed client/API pair:

```env
CLIENT_ORIGINS=https://e-pharmacy-client-ten.vercel.app
CLIENT_APP_URL=https://e-pharmacy-client-ten.vercel.app
```

## Getting Started

```bash
git clone https://github.com/Natalia-Skoropad/e-pharmacy
cd e-pharmacy
pnpm install
```

Create `apps/api/.env` and add the required variables.

Seed the database:

```bash
pnpm seed:api
```

Start the API:

```bash
pnpm dev:api
```

Check API health:

```txt
http://localhost:4000/health
```

## Available Scripts

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

## Security Notes

- Auth uses backend-managed httpOnly cookies.
- Private customer endpoints are protected with `authenticate` middleware.
- Role-based middleware exists as a foundation for future customer/vendor/admin boundaries.
- Cookie-based non-safe mutations are hardened with Origin/Referer validation.
- The same-origin BFF flow allows the browser to avoid direct cross-site private API calls.
- `AUTH_COOKIE_SAME_SITE=lax` is preferred for the current BFF model.
- A larger production deployment could add CSRF tokens on top of the current strategy.

## Future Development

The API will be expanded for the next E-PHARMACY apps.

### Vendor backend modules planned

- vendor shop creation and editing
- vendor-owned medicine CRUD
- shop statistics
- client goods modal data
- vendor order visibility
- pharmacy cabinet permissions

### Admin backend modules planned

- admin dashboard statistics
- orders management
- products management
- customers management
- suppliers CRUD
- moderation workflows
- admin-only filters and tables

The current API already includes role-based middleware and shared customer-facing models to support this direction.

## Deployment Notes

Before deploying the API, run:

```bash
pnpm check:api
```

Recommended production checklist:

- set production `MONGODB_URI`
- set strong `JWT_SECRET`
- configure SMTP credentials
- configure allowed `CLIENT_ORIGINS`
- choose proper `AUTH_COOKIE_SAME_SITE` for the deployment model
- set `AUTH_COOKIE_DOMAIN` only when needed
- verify deployed CORS allows the production client origin
- verify Origin/Referer validation allows the deployed client and blocks unexpected mutation origins
- verify password reset email links
- verify checkout creates real MongoDB orders

## Highlights

What makes this API especially interesting:

- one shared backend foundation for a multi-app pharmacy ecosystem
- customer-ready auth, products, stores, reviews, favorites, cart, and orders modules
- prepared role foundation for future vendor and admin flows
- typed validation-first architecture
- secure password recovery flow through email
- cookie-based mutations hardened with client-origin validation
- reusable service/controller/middleware structure
- MongoDB persistence for customer-facing business data

## Author

**Nataliia Skoropad**  
Full-stack Developer  
Backend development, Frontend development, UI/UX design

## License

Portfolio shared backend API built with production-oriented architecture.
