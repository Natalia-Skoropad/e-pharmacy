# E-PHARMACY Vendor

> A planned pharmacy/vendor cabinet for managing pharmacy profile data, medicines, stock, statistics, and customer-related order data.

## Overview

**E-PHARMACY Vendor** will be the private workspace for pharmacy owners and pharmacy managers inside the E-PHARMACY ecosystem.

The vendor app is planned as the second major frontend application after the customer client release.

It will allow pharmacy owners to:

- create and manage a pharmacy shop profile
- edit pharmacy contact and business information
- add, edit, and delete medicines
- manage pharmacy-specific product availability and stock
- review pharmacy product lists
- view statistics
- inspect customer goods and order-related data

> Current status: development is planned to start in the next few days. The folder currently acts as a placeholder in the monorepo so the ecosystem structure is clear from the beginning.

---

## Ecosystem Role

E-PHARMACY is designed as one connected platform:

```txt
apps/client  -> customer storefront
apps/vendor  -> pharmacy/vendor cabinet
apps/admin   -> admin dashboard
apps/api     -> one shared backend API
```

The vendor cabinet will use the same shared backend API, shared types, shared validation, and shared UI patterns where possible. The completed client app already defines many reusable patterns for forms, modals, protected layouts, empty states, and API integration, so the vendor app should extend the ecosystem instead of starting from a blank pharmacy shelf.

---

## Planned Features

### Vendor authentication and protection

- vendor login flow
- protected vendor-only routes
- role-based access through the shared API and real backend authorization
- current vendor profile loading
- redirect protection for unauthorized users

### Pharmacy shop management

- create pharmacy shop profile
- edit shop details
- manage shop address, contacts, schedule, and description
- view public-facing shop preview data

### Medicine management

- add new medicine to the vendor shop
- edit existing medicine data
- delete medicine from the vendor shop
- view all medicines in a vendor table
- open product details from the cabinet
- manage availability and active quantity

### Statistics

- pharmacy performance overview
- product availability metrics
- customer/order-related metrics
- dashboard cards and charts where useful

### Customer goods modal

- view customer goods details
- inspect products connected with customer orders
- prepare data for future order-management workflows

### UX and interface

- responsive protected layout
- dashboard-style navigation
- reusable tables, filters, buttons, forms, modals, and empty states
- loading, error, success, and not-found states
- consistent design with the completed client storefront

---

## Planned Tech Stack

### Frontend

- **Next.js**
- **React**
- **TypeScript**
- **CSS Modules**

### Shared workspace packages

- `@e-pharmacy/ui`
- `@e-pharmacy/types`
- `@e-pharmacy/api-client`
- `@e-pharmacy/validation`
- `@e-pharmacy/config`
- `@e-pharmacy/utils`

### Backend integration

- shared E-PHARMACY API
- vendor-protected routes
- role-based authorization
- MongoDB-backed shop and product data

---

## Planned Project Structure

```txt
apps/vendor/
  public/
  src/
    app/
      login/
      dashboard/
      shop/
      medicines/
      statistics/
      layout.tsx
      page.tsx
    components/
      auth/
      dashboard/
      medicines/
      modals/
      shop/
      statistics/
    hooks/
    lib/
      api/
      auth/
      constants/
      routes/
      validations/
    providers/
    services/
    styles/
    types/
```

The exact structure may change during implementation, but the app will follow the same clean modular approach as the completed client application.

---

## Planned Main Pages

### Vendor login

A protected authentication entry point for pharmacy owners and managers.

### Dashboard

A private overview page with key pharmacy metrics, quick links, and status cards.

### Shop profile

A page for creating and editing pharmacy information shown to customers.

### Medicines

A vendor medicine management area with product tables, filters, add/edit/delete actions, and product details.

### Statistics

A page for pharmacy analytics and operational insights.

---

## Backend Dependency

The vendor app will be connected to the existing shared API from `apps/api`.

Planned vendor API areas:

- vendor auth and current user
- shop create/read/update
- vendor product CRUD
- shop statistics
- client goods data
- vendor order-related data

The backend will be extended inside the same shared API instead of creating a separate vendor backend. Private vendor mutations should follow the same production-oriented pattern as the client app: same-origin BFF routes, httpOnly cookie auth, backend authorization, and Origin/Referer validation.

---

## Environment Variables

The final variables will be defined during implementation. A likely local setup will include:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3001
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

---

## Getting Started

The app is not implemented yet. After development starts, the expected monorepo flow will be:

```bash
pnpm install
pnpm dev:vendor
```

The final scripts will be added when the app package is created.

---

## Development Notes

Planned implementation priorities:

- create vendor app foundation
- add protected layout
- connect auth with shared API roles
- build shop create/edit flow
- build medicine CRUD flow
- add statistics and customer goods modal
- reuse shared UI and validation wherever possible

---

## Highlights

What will make this app especially interesting:

- role-based vendor workspace inside a larger marketplace ecosystem
- shared backend instead of duplicated API logic
- reusable form, modal, table, and dashboard patterns
- pharmacy-specific inventory management
- foundation for future order-management workflows

---

## Author

**Nataliia Skoropad**  
Full-stack Developer  
Backend development, Frontend development, UI/UX design

---

## License

Portfolio vendor cabinet roadmap for a production-oriented multi-app e-commerce ecosystem.
