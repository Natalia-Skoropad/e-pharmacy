# E-PHARMACY Client

> A responsive customer storefront for browsing pharmacy stores, finding medicines, managing a cart, and creating online orders.

![E-PHARMACY client cover](./public/og/og-cover.jpg)

## Overview

**E-PHARMACY Client** is the first completed frontend application in the E-PHARMACY ecosystem.

The client app allows customers to:

- explore pharmacy stores in a clean public catalog
- search, filter, and sort medicines
- open detailed product and pharmacy pages with SEO-friendly URLs
- add medicines to favorites and cart
- group cart items by pharmacy invoices
- complete checkout with pickup or post delivery details
- view profile information and confirmed orders
- submit and read product or pharmacy reviews

The project focuses on a polished customer experience, reusable UI architecture, route-driven SEO, responsive layouts, and integration with one shared backend API.

> Current status: the client storefront is ready as the first release target. It may be extended later when the vendor cabinet and admin panel are developed.

---

## Live Demo

```txt
https://e-pharmacy-client-ten.vercel.app
```

---

## Screenshots

### Home page

![Home page](./public/readme/home-page.jpg)

### Registration page

![Registration page](./public/readme/registration-page.jpg)

### Pharmacy catalog

![Pharmacy catalog](./public/readme/pharmacy-catalog.jpg)

### Pharmacy details page

![Pharmacy details page](./public/readme/pharmacy-page.jpg)

### Product catalog

![Product catalog](./public/readme/product-catalog.jpg)

### Product details page

![Product details page](./public/readme/product-page.jpg)

### Cart page

![Cart page](./public/readme/cart-page.jpg)

### Order confirmation page

![Order confirmation page](./public/readme/order-confirmation-page.jpg)

### Order details page

![Order details page](./public/readme/order-page.jpg)

### Profile page

![Profile page](./public/readme/profile-page.jpg)

### Information page

![Information page](./public/readme/information-page.jpg)

### 404 page

![404 page](./public/readme/404-page.jpg)

---

## Features

### Authentication and protected customer flow

- customer registration and login
- logout with session cleanup
- current user loading
- protected routes for cart, checkout, profile, and orders
- guest-only protection for auth pages
- password recovery through email reset flow
- profile editing and password changing

### Pharmacy stores

- public pharmacy stores catalog
- search by pharmacy name and address
- city filtering
- sorting and pagination
- pharmacy details pages with pretty URLs
- pharmacy reviews
- favorite pharmacy toggle for authenticated users
- responsive cards for mobile, tablet, and desktop

### Medicines catalog

- public medicine catalog
- search by product name and article
- category filtering
- availability filtering
- sorting by rating and name
- pagination
- product details pages with SEO-friendly slugs
- pharmacy price availability section
- product characteristics and reviews
- favorite medicine toggle for authenticated users

### Cart and checkout

- add products to cart from product and pharmacy contexts
- cart grouped by pharmacy invoices
- quantity controls with stock limits
- invoice-level summaries
- continue-shopping modal scoped to the selected pharmacy
- checkout flow with pickup or post delivery
- confirmed orders saved through the backend
- delivery address and customer comment stored in confirmed order details

### Profile and orders

- customer profile page
- editable profile fields
- password changing flow
- order history
- detailed order page with pharmacy, products, delivery method, address, comment, and totals

### SEO and routing

- public indexable routes for home, catalogs, detail pages, and information pages
- clean human-readable URLs for catalog states and root-level detail pages
- legacy redirects from `/products/[slugId]` and `/pharmacies/[slugId]` to canonical root detail URLs
- dynamic page titles and meta descriptions
- canonical URLs for indexable and non-indexable catalog states
- Open Graph metadata with a 1200x630 cover image
- Twitter card metadata
- dynamic sitemap generation for static pages, active pharmacies, and in-stock products
- robots rules for private/auth/service routes
- noindex logic for search, sorting, pagination, unavailable results, and private pages
- breadcrumbs generated from route data
- semantic page structure with one clear `h1` per page
- dedicated not-found and error pages

### UX and interface

- responsive layout for mobile, tablet, and desktop
- shared header, mobile offcanvas, footer, breadcrumbs, buttons, modals, tabs, forms, toasts, and status pages
- shimmer image placeholders
- loading, empty, success, error, and not-found states
- reusable filters and search controls
- accessible modal and offcanvas behavior

---

## Tech Stack

### Frontend

- **Next.js 16**
- **React 19**
- **TypeScript**
- **CSS Modules**

### UI and utilities

- **Lucide React**
- **clsx**
- lightweight shared UI contracts
- shared internal utilities package

### Data and backend integration

- shared backend API
- same-origin Next.js BFF route handlers for private customer flows
- lightweight shared API response contracts
- shared TypeScript generic types
- shared validation constants and sanitizers

### Monorepo tooling

- **pnpm workspaces**
- **Turborepo**
- shared configuration package

---

## Project Structure

```txt
apps/client/
  public/
    icons/
    images/
    og/
    readme/
  src/
    app/
      (private)/
        cart/
        checkout/
        profile/
      (public)/
        login/
        register/
        password-recovery/
        reset-password/
        medicines-catalog/
        pharmacy-stores/
        products/[slugId]/
        pharmacies/[slugId]/
        delivery-and-payment/
        return-policy/
        user-agreement/
        personal-data-notice/
      error.tsx
      layout.tsx
      not-found.tsx
      page.tsx
    components/
      auth/
      cart/
      common/
      home/
      info/
      layout/
      medicines-catalog/
      modals/
      orders/
      pharmacy-stores/
      product-details/
      profile/
    hooks/
    lib/
      api/
      auth/
      catalog/
      checkout/
      constants/
      orders/
      routes/
      seo/
      utils/
      validations/
    providers/
    services/
    styles/
    types/
```

---

## Main Pages

### Home

A public landing page that introduces the service, explains the customer flow, and guides users to pharmacies and medicines.

### Authentication pages

Registration, login, password recovery, and reset-password pages with validation, user-friendly states, and redirect protection.

### Pharmacy stores

A public catalog for browsing pharmacies with search, city filtering, sorting, pagination, favorite actions, and detail pages.

### Medicines catalog

A public catalog for browsing medicines with search, filters, sorting, pagination, product cards, and detailed product pages.

### Cart

A private customer page where medicines are grouped by pharmacy invoice with stock-aware quantity controls and invoice summaries.

### Checkout

A private confirmation flow for creating orders with delivery method selection, customer contact data, address, comment, and backend order saving.

### Profile

A private customer account page for profile editing, password changing, and reviewing previous orders.

### Information pages

Public pages for delivery and payment, return policy, user agreement, and personal data notice.

---

## SEO Details

The client app has a dedicated SEO layer for public pages. The goal is to keep useful customer pages indexable, avoid duplicate catalog URLs, and prevent private or low-value states from entering search results. Tiny SEO janitor, but with a green pharmacy badge.

### SEO architecture

SEO logic is centralized instead of being scattered across components:

```txt
src/lib/constants/metadata.ts  -> site name, site URL, default metadata, OG image
src/lib/constants/seo.ts       -> indexable routes, noindex routes, sitemap routes
src/lib/seo/create-page-metadata.ts -> shared metadata builder
src/lib/seo/url.ts             -> absolute URL helper
src/app/sitemap.ts             -> dynamic sitemap generation
src/app/robots.ts              -> robots.txt rules
src/lib/catalog/*              -> catalog URL, canonical, title, description, noindex logic
src/lib/details/*              -> product/pharmacy detail metadata and canonical resolver
```

### Public indexable routes

The main public pages are available for indexing:

```txt
/
/pharmacy-stores
/medicines-catalog
/delivery-and-payment
/return-policy
/user-agreement
/personal-data-notice
/{product-name}-{productId}
/{pharmacy-name}-{pharmacyId}
```

Dynamic product and pharmacy detail pages are included through sitemap generation when the API returns valid active data.

### Routes excluded from indexing

Private, auth, and service pages are intentionally excluded from sitemap/robots and receive noindex where needed:

```txt
/cart
/checkout
/checkout/*
/profile
/profile/*
/login
/register
/password-recovery
/reset-password
/admin
/admin/*
/vendor
/vendor/*
error pages
not-found pages
```

This prevents customer account data, checkout states, auth pages, and future private dashboards from appearing in search results.

### Product and pharmacy detail routes

Each product and pharmacy has a clean root-level URL:

```txt
/paracetamol-max-500-mg-60-6a01bcd0b2ed6525cedea937
/wellness-hub-pharmacy-chernihiv-91-6a01bcd0b2ed6525cedea940
```

Legacy paths are still supported, but they redirect permanently to the canonical URL:

```txt
/products/[slugId]    -> /[slugId]
/pharmacies/[slugId]  -> /[slugId]
```

If a user opens a detail page with an outdated or incorrect slug, the app resolves the entity by id and redirects to the canonical slug. If the entity does not exist, the page returns the not-found state and noindex metadata.

### Medicine catalog routing

The medicine catalog supports index-friendly route segments for meaningful primary filters:

```txt
/medicines-catalog
/medicines-catalog/category-antibiotics
/medicines-catalog/pharmacy-wellness-hub-pharmacy-6a01bcd0b2ed6525cedea940
/medicines-catalog/category-antibiotics/pharmacy-wellness-hub-pharmacy-6a01bcd0b2ed6525cedea940
```

Search, article search, availability, sorting, and pagination are kept as query states and are treated as non-indexable catalog states:

```txt
/medicines-catalog?name=para
/medicines-catalog?article=abc-100
/medicines-catalog?availability=in-stock
/medicines-catalog?sort=rating-desc
/medicines-catalog?page=2
```

For these states, the canonical URL points back to the indexed base path for the selected category/pharmacy combination, while the page receives `noindex, follow`.

### Pharmacy catalog routing

The pharmacy catalog uses readable route segments:

```txt
/pharmacy-stores
/pharmacy-stores/city-kyiv
/pharmacy-stores/search-name-health
/pharmacy-stores/address-main-street
/pharmacy-stores/sort-rating-desc
/pharmacy-stores/page-2
```

City pages can be indexable because they describe a stable location-based catalog. Search by name/address, sorting, pagination, and empty-result states are noindex to avoid thin or duplicate pages.

### Metadata generation

The shared metadata helper creates a consistent metadata shape for pages:

- `title`
- `description`
- canonical URL
- Open Graph title, description, URL, and image
- Twitter summary card metadata
- robots index/follow settings

The default Open Graph image is stored in `public/og/og-cover.jpg` and is configured as a 1200x630 image.

### Dynamic catalog metadata

Catalog pages generate titles and descriptions from the selected route state. Examples:

```txt
Medicine catalog
Choose trusted antibiotics online
Choose medicines from Wellness Hub Pharmacy
Choose antibiotics from Wellness Hub Pharmacy
Pharmacy stores
Choose a pharmacy store in Kyiv
```

Descriptions also change based on selected category, pharmacy, or city, so indexable catalog pages do not all look like copy-paste clones wearing the same white coat.

### SEO text blocks

Catalog pages include an SEO text block for indexable states. The text is hidden for noindex states such as search, sorting, pagination, filtered empty results, or availability-only states.

This keeps useful landing pages informative without adding SEO text to temporary UI states.

### Sitemap generation

`sitemap.ts` generates:

```txt
/
/pharmacy-stores
/medicines-catalog
/delivery-and-payment
/return-policy
/user-agreement
/personal-data-notice
/product-and-pharmacy-detail-pages
```

The sitemap fetches products and stores from the API, then includes:

- products with valid `id`, `name`, and `inStock !== false`
- stores with valid `id`, `name`, and `isActive !== false`

Duplicate sitemap paths are deduplicated before the final sitemap response is returned.

### Robots rules

`robots.ts` allows public pages and disallows private/auth/future dashboard paths. It also points crawlers to:

```txt
/sitemap.xml
```

### Canonical strategy

The canonical strategy is intentionally strict:

- clean detail pages point to their own canonical root URL
- outdated product/pharmacy slugs redirect to the canonical URL
- legacy `/products/*` and `/pharmacies/*` routes redirect to root detail URLs
- noindex catalog states canonicalize back to the nearest stable indexed catalog URL
- private pages are excluded from sitemap and robots

### Performance and crawl stability

Public catalog/detail pages use revalidation to keep server-rendered content reasonably fresh without forcing every request to be fully dynamic. Sitemap data is also fetched with revalidation, so crawlers can discover new active products and pharmacies without turning the app into a caffeine-powered spider trap.

---

## API Integration

The client communicates with the shared backend API from `apps/api` through two intentional paths:

```txt
Public/server data -> Express API -> MongoDB
Browser private flow -> Next.js same-origin /api/* route handlers -> Express API -> MongoDB
```

Public catalog data, SEO metadata, sitemap data, and read-only pages can be loaded server-side from the backend API. Auth, cart, checkout, orders, profile updates, and other customer-only mutations go through the Next.js BFF route handlers under `apps/client/src/app/api/*`.

This BFF layer keeps browser requests same-origin, forwards cookies to the backend, and copies backend `Set-Cookie` headers back to the client response. The backend remains the source of truth for private access through `authenticate` middleware and the real httpOnly auth cookie.

The client-readable `e_pharmacy_auth_ready` cookie is only a UX/session marker for redirects and auth bootstrap. It is not a security token and does not authorize backend data access.

Main API areas used by the client:

- auth
  - register
  - login
  - current user
  - profile update
  - password update
  - forgot password
  - reset password
  - logout

- stores
  - stores catalog
  - store filters
  - store details
  - store reviews
  - store favorites

- products
  - products catalog
  - product filters
  - product details
  - product reviews
  - review moderation readiness
  - product favorites

- cart
  - get cart
  - add cart item
  - update cart item
  - remove cart item
  - clear cart

- orders
  - checkout
  - order history
  - order details

---

## Environment Variables

Create an `.env.local` file inside `apps/client`. The source of truth for client keys is `apps/client/.env.example`.

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

### Variable reference

| Variable | Used for | Example |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | canonical URLs, metadata, sitemap, robots, absolute public URLs | `http://localhost:3000` |
| `NEXT_PUBLIC_API_BASE_URL` | backend URL used by server-side data fetches and Next.js BFF route handlers | `http://localhost:4000` |

For production, replace these values with the deployed client and API URLs. Client-side private flows should continue to call same-origin `/api/*` routes, while those route handlers use `NEXT_PUBLIC_API_BASE_URL` to reach the backend.

The browser should not call private backend mutations directly. Auth, cart, checkout, orders, profile updates, password updates, and logout should keep using the same-origin BFF route handlers.

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Natalia-Skoropad/e-pharmacy
cd e-pharmacy
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Add environment variables

Create `apps/client/.env.local` and add the required variables.

### 4. Start the client app

```bash
pnpm dev:client
```

### 5. Open the app

```txt
http://localhost:3000
```

---

## Available Scripts

From the monorepo root:

```bash
pnpm dev:client
pnpm build:client
pnpm lint:client
pnpm type-check:client
pnpm check:client
```

From `apps/client`:

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm type-check
```

---

## Deployment Notes

Before deploying the client, run:

```bash
pnpm check:client
```

Recommended production checklist:

- set production `NEXT_PUBLIC_SITE_URL`
- set production `NEXT_PUBLIC_API_BASE_URL`
- verify API CORS, cookie, and Origin/Referer settings
- verify private auth/cart/order flows go through same-origin `/api/*` route handlers
- verify sitemap and robots rules
- confirm private routes are not indexed
- confirm checkout and order creation work with the deployed API

---

## Highlights

What makes this client app especially interesting:

- full customer storefront flow from catalog discovery to confirmed order
- clean monorepo architecture with lightweight shared workspace contracts
- SEO-friendly routing for catalogs and detail pages
- reusable UI system with consistent buttons, cards, modals, tabs, toasts, and forms
- responsive design across mobile, tablet, and desktop
- backend-powered cart and order flow through a Next.js BFF layer
- thoughtful empty, loading, error, success, and not-found states

---

## Author

**Nataliia Skoropad**  
Full-stack Developer  
Backend development, Frontend development, UI/UX design

---

## License

Portfolio customer storefront built with production-oriented e-commerce architecture.
