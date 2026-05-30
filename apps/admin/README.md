# E-PHARMACY Admin

> A planned administration dashboard for managing the E-PHARMACY ecosystem, including orders, products, customers, suppliers, and platform statistics.

## Overview

**E-PHARMACY Admin** will be the private administration panel for managing platform-level data across the E-PHARMACY ecosystem.

The admin app is planned after the vendor cabinet is completed.

It will allow administrators to:

- review dashboard statistics
- manage orders
- manage products
- manage customers
- manage suppliers
- use filters and tables for operational workflows
- create and edit products and suppliers through modal forms
- support moderation and internal management flows

> Current status: development will start after the vendor app is completed. The folder currently acts as a placeholder in the monorepo so the final ecosystem architecture stays visible and prepared.

---

## Ecosystem Role

E-PHARMACY is designed as one connected multi-app platform:

```txt
apps/client  -> customer storefront
apps/vendor  -> pharmacy/vendor cabinet
apps/admin   -> admin dashboard
apps/api     -> one shared backend API
```

The admin panel will use the same shared backend API and the same shared packages for types, validation, configuration, utilities, and UI patterns where possible. It should reuse the ecosystem foundation created by the client and vendor apps instead of duplicating API, validation, and UI logic.

---

## Planned Features

### Admin authentication and protection

- admin login flow
- protected admin-only routes
- role-based access through the shared API and real backend authorization
- current admin user loading
- redirect protection for unauthorized users

### Dashboard

- platform overview cards
- order statistics
- product statistics
- customer statistics
- supplier statistics
- quick access to main admin sections

### Orders management

- orders table
- order filters
- order pagination
- order details and status visibility
- future-ready order lifecycle management

### Products management

- products table
- filters and search
- product create modal
- product edit modal
- product delete or archive flow
- product details access

### Customers management

- customers table
- customer filters
- customer details readiness
- order/customer relationship visibility

### Suppliers management

- suppliers table
- supplier create modal
- supplier edit modal
- supplier delete/archive flow
- supplier filters and pagination

### UX and interface

- admin dashboard layout with header and sidebar
- reusable tables, filters, pagination, modals, forms, and status states
- consistent visual system with the client and vendor apps
- responsive behavior for smaller screens where needed

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
- admin-protected routes
- role-based authorization
- MongoDB-backed operational data

---

## Planned Project Structure

```txt
apps/admin/
  public/
  src/
    app/
      login/
      dashboard/
      orders/
      products/
      customers/
      suppliers/
      layout.tsx
      page.tsx
    components/
      auth/
      dashboard/
      layout/
      orders/
      products/
      customers/
      suppliers/
      modals/
      tables/
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

The exact structure may change during implementation, but the app will follow the same modular and reusable approach used in the completed client app.

---

## Planned Main Pages

### Admin login

A protected authentication page for platform administrators.

### Dashboard

A high-level overview of platform metrics, operational counters, and quick admin actions.

### Orders

A management page for reviewing and filtering orders.

### Products

An admin product management page with table, filters, create/edit modals, and pagination.

### Customers

A customer management page for reviewing registered users and related platform data.

### Suppliers

A supplier management page with CRUD-ready table and modal flows.

---

## Backend Dependency

The admin app will be connected to the existing shared API from `apps/api`.

Planned admin API areas:

- admin auth and current user
- dashboard statistics
- orders management
- products CRUD
- customers list and details
- suppliers CRUD
- moderation workflows

The backend will be extended inside the same shared API instead of creating a separate admin backend. Private admin mutations should follow the same production-oriented pattern as the client app: same-origin BFF routes, httpOnly cookie auth, backend authorization, and Origin/Referer validation.

---

## Environment Variables

The final variables will be defined during implementation. A likely local setup will include:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3002
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

---

## Getting Started

The app is not implemented yet. After development starts, the expected monorepo flow will be:

```bash
pnpm install
pnpm dev:admin
```

The final scripts will be added when the app package is created.

---

## Development Notes

Planned implementation priorities:

- create admin app foundation
- add protected admin layout with sidebar and header
- connect auth with shared API roles
- build dashboard statistics
- build orders table
- build products CRUD flow
- build customers and suppliers sections
- reuse shared UI, types, API client, and validation wherever possible

---

## Highlights

What will make this app especially interesting:

- admin dashboard for a multi-app pharmacy ecosystem
- shared API and shared packages instead of duplicated logic
- table-driven operational workflows
- reusable modal and form patterns
- role-based access and protected platform management

---

## Author

**Nataliia Skoropad**  
Full-stack Developer  
Backend development, Frontend development, UI/UX design

---

## License

Portfolio admin dashboard roadmap for a production-oriented multi-app e-commerce ecosystem.
