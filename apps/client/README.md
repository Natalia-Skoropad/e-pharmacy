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
Add deployed client URL here
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

- public indexable routes for home, catalogs, details, and information pages
- private routes excluded from sitemap and robots
- route-driven metadata
- canonical URLs
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
- shared internal UI package
- shared internal utilities package

### Data and backend integration

- shared backend API
- shared API client package
- shared TypeScript types
- shared validation package
- authenticated requests through the backend API

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

## API Integration

The client communicates with the shared backend API from `apps/api`.

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

Create an `.env.local` file inside `apps/client`.

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

For production, replace these values with the deployed client and API URLs.

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
- verify API CORS and cookie settings
- verify sitemap and robots rules
- confirm private routes are not indexed
- confirm checkout and order creation work with the deployed API

---

## Highlights

What makes this client app especially interesting:

- full customer storefront flow from catalog discovery to confirmed order
- clean monorepo architecture with shared packages
- SEO-friendly routing for catalogs and detail pages
- reusable UI system with consistent buttons, cards, modals, tabs, toasts, and forms
- responsive design across mobile, tablet, and desktop
- backend-powered cart and order flow
- thoughtful empty, loading, error, success, and not-found states

---

## Author

**Nataliia Skoropad**  
Full-stack Developer  
Backend development, frontend development, UI/UX design, responsive layout, and user experience improvements

---

## License

This project is created for educational and portfolio purposes.
