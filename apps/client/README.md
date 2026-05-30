# E-PHARMACY Client

> A responsive customer storefront for browsing pharmacy stores, finding medicines, managing a cart, and creating online orders.

![E-PHARMACY client cover](./public/og/og-cover.jpg)

## Overview

**E-PHARMACY Client** is the completed customer-facing application in the E-PHARMACY portfolio release.

The client app allows customers to:

- explore pharmacy stores in a clean public catalog
- search, filter, and sort medicines
- open detailed product and pharmacy pages with SEO-friendly URLs
- add medicines and pharmacies to favorites
- add medicines to cart and group cart items by pharmacy invoice
- complete checkout with pickup or post delivery details
- view profile information and confirmed orders
- submit and read product or pharmacy reviews

The project focuses on polished customer UX, route-driven SEO, responsive layouts, reusable UI architecture, and integration with one shared backend API.

> Current status: completed customer storefront for the portfolio release. Vendor and admin applications are roadmap-only and are not implemented in this client app.

## Live Demo

```txt
https://e-pharmacy-client-ten.vercel.app
```

## Screenshots

### Home page

![Home page](./public/readme/home-page.jpg)

### Registration page

![Registration page](./public/readme/registration-page.jpg)

### Pharmacy catalog

![Pharmacy catalog](./public/readme/pharmacy-catalog.jpg)

### Pharmacy details page

![Pharmacy details page](./public/readme/pharmacy-page.jpg)

### Medicines catalog

![Medicines catalog](./public/readme/product-catalog.jpg)

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
- pharmacy details pages with readable URLs
- pharmacy reviews
- favorite pharmacy toggle for authenticated users
- responsive cards for mobile, tablet, and desktop

### Medicines catalog

- public medicine catalog
- search by product name and article
- category filtering
- pharmacy filtering
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

- shared Express/MongoDB backend API
- same-origin Next.js BFF route handlers for private customer flows
- lightweight shared API response contracts
- shared TypeScript generic types
- shared validation constants and sanitizers

### Monorepo tooling

- **pnpm workspaces**
- **Turborepo**
- shared configuration package

## Project Structure

```txt
apps/client/
  public/
    icons/
    og/
    readme/
  src/
    app/
      (private)/
        cart/
        checkout/[slugId]/
        profile/
          orders/[orderId]/
      (public)/
        (auth)/
          login/
          register/
          password-recovery/
          reset-password/
        (info)/
          delivery-and-payment/
          personal-data-notice/
          return-policy/
          user-agreement/
        (medicines)/
          medicines-catalog/[[...segments]]
          products/[slugId]/
        (pharmacies)/
          pharmacy-stores/[[...segments]]
          pharmacies/[slugId]/
        [slugId]/
      api/
        auth/
          login/
          logout/
          me/
          password/
          register/
          request-reset-email/
          reset-password/
        cart/
          clear/
          items/[cartItemId]/
        orders/
          checkout/
          [orderId]/
        products/
          [productId]/favorite/
          [productId]/reviews/
          filters/
        stores/
          [storeId]/favorite/
          [storeId]/reviews/
          filters/
        health/
      error.tsx
      layout.tsx
      loading.tsx
      not-found.tsx
      page.tsx
      robots.ts
      sitemap.ts
    components/
      auth/
      cart/
      checkout/
      common/
      form-fields/
      home/
      info/
      layout/
      medicines-catalog/
      modals/
      pharmacy-stores/
      profile/
    hooks/
    lib/
      accessibility/
      api/
      auth/
      cart/
      catalog/
      checkout/
      constants/
      details/
      errors/
      formatters/
      orders/
      reviews/
      routes/
      seo/
      utils/
      validations/
    providers/
    services/
    styles/
    types/
```

## Frontend Architecture Notes

### Private pages and sitemap boundary

Private customer pages are protected at the UI level and marked with `noIndex: true` metadata:

```txt
src/app/(private)/cart/page.tsx
src/app/(private)/checkout/page.tsx
src/app/(private)/checkout/[slugId]/page.tsx
src/app/(private)/profile/page.tsx
src/app/(private)/profile/orders/[orderId]/page.tsx
```

They are also excluded from `sitemap.ts` because `SITEMAP_STATIC_ROUTES` is derived from `INDEXABLE_ROUTES`. This keeps cart, checkout, profile, and order pages out of public search discovery.

### Dynamic root detail route

The root-level detail route keeps public URLs short and SEO-friendly:

```txt
src/app/(public)/[slugId]/page.tsx
```

This route resolves whether the incoming `slugId` belongs to a product or a pharmacy, renders the correct detail page, and permanently redirects legacy or non-canonical URLs to the current canonical root URL.

Legacy detail routes are kept only as redirect entry points:

```txt
src/app/(public)/(medicines)/products/[slugId]/page.tsx
src/app/(public)/(pharmacies)/pharmacies/[slugId]/page.tsx
```

This design gives the portfolio clean URLs, while the README documents the extra maintenance responsibility of resolving two entity types from one root dynamic route. Tiny router detective, very serious hat.

### Auth provider scope

`AuthProvider` is mounted globally because the header, cart, favorites, protected routes, and customer actions all depend on auth state. The bootstrap is intentionally lightweight: it reads the client-readable session marker first and calls `/api/auth/me` only when the marker exists. Public pages can still render server-side content without waiting for private user data.

The marker cookie is not authorization. It only helps redirects and client session bootstrap. Backend `authenticate` middleware and the httpOnly auth cookie remain the real private data boundary.

### HTML language

The current UI copy is English, so `html lang="en"` in `src/app/layout.tsx` is technically correct. If the product is later positioned as a Ukrainian-localized pharmacy experience, the next step should be a planned i18n layer rather than only changing the `lang` value.

## Main Pages

### Home

A public landing page that introduces the service, explains the customer flow, and guides users to pharmacies and medicines.

### Authentication pages

Registration, login, password recovery, and reset-password pages with validation, user-friendly states, and redirect protection.

### Pharmacy stores

A public catalog for browsing pharmacies with search, city filtering, sorting, pagination, favorite actions, reviews, and detail pages.

### Medicines catalog

A public catalog for browsing medicines with search, filters, sorting, pagination, product cards, reviews, and detailed product pages.

### Cart

A private customer page where medicines are grouped by pharmacy invoice with stock-aware quantity controls and invoice summaries.

### Checkout

A private confirmation flow for creating orders with delivery method selection, customer contact data, address, comment, and backend order saving.

### Profile

A private customer account page for profile editing, password changing, and reviewing previous orders.

### Information pages

Public pages for delivery and payment, return policy, user agreement, and personal data notice.

## SEO Details

The client app has a dedicated SEO layer for public pages. The goal is to keep useful customer pages indexable, avoid duplicate catalog URLs, and prevent private or low-value states from entering search results. Tiny SEO janitor, but with a green pharmacy badge.

### SEO architecture

```txt
src/lib/constants/metadata.ts        -> site name, site URL, default metadata, OG image
src/lib/constants/seo.ts             -> indexable routes, noindex routes, sitemap routes
src/lib/seo/create-page-metadata.ts  -> shared metadata builder
src/lib/seo/url.ts                   -> absolute URL helper
src/app/sitemap.ts                   -> dynamic sitemap generation
src/app/robots.ts                    -> robots.txt rules
src/lib/catalog/*                    -> catalog URL, canonical, title, description, noindex logic
src/lib/details/*                    -> product/pharmacy detail metadata and canonical resolver
```

### Public indexable routes

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

### Catalog routing

The medicines catalog supports index-friendly route segments for meaningful primary filters:

```txt
/medicines-catalog
/medicines-catalog/category-antibiotics
/medicines-catalog/pharmacy-wellness-hub-pharmacy-6a01bcd0b2ed6525cedea940
/medicines-catalog/category-antibiotics/pharmacy-wellness-hub-pharmacy-6a01bcd0b2ed6525cedea940
```

Search, article search, availability, sorting, and pagination are kept as temporary states and are treated as non-indexable when needed.

The pharmacy catalog uses readable route segments:

```txt
/pharmacy-stores
/pharmacy-stores/city-kyiv
/pharmacy-stores/search-name-health
/pharmacy-stores/address-main-street
/pharmacy-stores/sort-rating-desc
/pharmacy-stores/page-2
```

City pages can be indexable because they describe stable location-based catalog content. Search by name/address, sorting, pagination, and empty-result states are noindex to avoid thin or duplicate pages.

### Sitemap and robots

`sitemap.ts` generates static public pages and active product/pharmacy detail pages from the API. `robots.ts` allows public pages and disallows private/auth/future dashboard paths while pointing crawlers to `/sitemap.xml`.

## API Integration

The client communicates with the shared backend API from `apps/api` through two intentional paths:

```txt
Public/server data -> Express API -> MongoDB
Browser private flow -> Next.js same-origin /api/* route handlers -> Express API -> MongoDB
```

Public catalog data, SEO metadata, sitemap data, and read-only pages can be loaded server-side from the backend API.

Auth, cart, checkout, orders, profile updates, password updates, review/favorite mutations, and other customer-only mutations go through the Next.js BFF route handlers under `apps/client/src/app/api/*`.

This BFF layer keeps browser requests same-origin, forwards cookies to the backend, and copies backend `Set-Cookie` headers back to the client response. The backend remains the source of truth for private access through `authenticate` middleware and the real httpOnly auth cookie.

The client-readable `e_pharmacy_auth_ready` cookie is only a UX/session marker for redirects and auth bootstrap. It is not a security token and does not authorize backend data access.

Main API areas used by the client:

- auth: register, login, current user, profile update, password update, password reset, logout
- stores: catalog, filters, details, reviews, favorites
- products: catalog, filters, details, reviews, moderation readiness, favorites
- cart: get cart, add/update/remove item, clear cart
- orders: checkout, order history, order details

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

The browser should not call private backend mutations directly. Auth, cart, checkout, orders, profile updates, password updates, review/favorite mutations, and logout should keep using the same-origin BFF route handlers.

## Getting Started

```bash
git clone https://github.com/Natalia-Skoropad/e-pharmacy
cd e-pharmacy
pnpm install
```

Create `apps/client/.env.local` and add the required variables.

Start the client app:

```bash
pnpm dev:client
```

Open the app:

```txt
http://localhost:3000
```

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

## Deployment Notes

Before deploying the client, run:

```bash
pnpm check:client
```

Recommended production checklist:

- set production `NEXT_PUBLIC_SITE_URL`
- set production `NEXT_PUBLIC_API_BASE_URL`
- verify API CORS, cookie, and Origin/Referer settings
- verify private auth/cart/order/review/favorite flows go through same-origin `/api/*` route handlers
- verify sitemap and robots rules
- confirm private routes are not indexed
- confirm checkout and order creation work with the deployed API

## Highlights

What makes this client app especially interesting:

- full customer storefront flow from catalog discovery to confirmed order
- clean monorepo architecture with lightweight shared workspace contracts
- SEO-friendly routing for catalogs and detail pages
- reusable UI system with consistent buttons, cards, modals, tabs, toasts, and forms
- responsive design across mobile, tablet, and desktop
- backend-powered cart and order flow through a Next.js BFF layer
- thoughtful empty, loading, error, success, and not-found states

## Author

**Nataliia Skoropad**  
Full-stack Developer  
Backend development, Frontend development, UI/UX design

## License

Portfolio customer storefront built with production-oriented e-commerce architecture.
