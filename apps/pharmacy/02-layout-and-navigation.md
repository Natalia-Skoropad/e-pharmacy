# Pharmacy Technical Specification — Layout and Navigation

## 1. Pharmacy layout parts

Pharmacy must include:

- Header;
- Sidebar / left navigation;
- Mobile menu;
- Breadcrumbs;
- protected layout for authenticated pharmacies without Footer;
- public layout for auth pages that may reuse the Client auth layout.

Footer is not used in the protected Pharmacy cabinet.

## 2. Protected Pharmacy layout

Protected layout is used for all authenticated Pharmacy cabinet pages.

It includes:

- `PharmacyHeader`;
- `PharmacySidebar` on desktop;
- `PharmacyMobileMenu` on mobile/tablet;
- one visible `main`;
- page content;
- Breadcrumbs inside pages before `h1`;
- no Footer.

Recommended structure:

```tsx
<>
  <PharmacyHeader />
  <div className={css.layout}>
    <PharmacySidebar />
    <main className={css.main}>{children}</main>
  </div>
</>
```

Important: there must be only one visible `<main>` on the page.

## 3. Public auth layout

Public layout is used for:

- `/login`;
- `/register`;
- `/password-recovery`.

It may reuse the Client auth layout.

Sidebar is not shown in public layout.

## 4. Pharmacy Header

Pharmacy Header is similar to Client Header, but with Pharmacy-specific navigation logic.

### Header contains

For unauthenticated users:

- Logo;
- Log in button;
- Register button;
- burger button on mobile/tablet if needed.

For authenticated pharmacies:

- Logo;
- pharmacy badge;
- Log out button;
- burger button on mobile/tablet.

### Header does not contain

- Client desktop navigation;
- cart button;
- cart count;
- links to Client catalog;
- links to Pharmacy stores.

Pharmacy navigation is located in Sidebar / Mobile menu.

## 5. Pharmacy badge

The pharmacy badge should be similar to the Client `UserBadge`.

Show:

- round pharmacy photo;
- fallback initials if photo is missing;
- pharmacy name;
- link to `/pharmacy/profile`.

Long names must be truncated with `text-overflow: ellipsis`.

Example:

```txt
[photo] Good Pharmacy
```

## 6. Logout

Logout can be shown in:

- Header;
- Sidebar bottom;
- Mobile menu.

On click:

- perform logout;
- clear auth/session state;
- redirect to `/login`;
- show loading state.

Loading text:

```txt
Logging out...
```

## 7. Mobile menu

Mobile menu opens with the burger button and shows the same navigation links as Sidebar.

It must:

- open above the page;
- lock body scroll;
- close on backdrop click;
- close on Escape;
- close on close button;
- close after route change;
- have focus trap;
- have correct `aria-label`, `aria-expanded`, and `aria-controls`.

## 8. Sidebar

Sidebar is the main Pharmacy navigation on desktop.

It is shown only in protected layout for pharmacies with statuses:

- `new`;
- `active`;
- `on_moderation`.

It is not shown for inactive pharmacies because inactive pharmacies cannot enter the cabinet.

### Sidebar links

| Label            | Route                        |
| ---------------- | ---------------------------- |
| Dashboard        | `/pharmacy/dashboard`        |
| Orders           | `/pharmacy/orders`           |
| Clients          | `/pharmacy/clients`          |
| Own products     | `/pharmacy/products`         |
| All products     | `/pharmacy/all-products`     |
| Product requests | `/pharmacy/product-requests` |
| Pharmacy profile | `/pharmacy/profile`          |

### Active state

Active state must work for nested pages.

Examples:

- `/pharmacy/orders` and `/pharmacy/orders/[orderId]` highlight **Orders**;
- `/pharmacy/product-requests`, `/pharmacy/product-requests/new`, `/pharmacy/product-requests/[requestId]`, and `/pharmacy/product-requests/[requestId]/edit` highlight **Product requests**.

## 9. Sidebar content

Sidebar top should show compact pharmacy info:

- photo or fallback avatar;
- pharmacy name;
- email;
- status.

Example:

```txt
[photo]
Good Pharmacy
pharmacy@example.com
Status: New
```

## 10. Breadcrumbs

Pharmacy must reuse the existing Client `Breadcrumbs` component.

Breadcrumbs are shown inside `main`, before `h1`.

Example page structure:

```tsx
<main className={css.page}>
  <section className={css.section} aria-labelledby="page-title">
    <Container>
      <Breadcrumbs items={createBreadcrumbs(PAGE_TITLE)} />
      <h1 id="page-title" className={css.title}>
        {PAGE_TITLE}
      </h1>
      <p className={css.text}>{PAGE_DESCRIPTION}</p>
    </Container>
  </section>
</main>
```

### Breadcrumb examples

| Page             | Breadcrumbs                                        |
| ---------------- | -------------------------------------------------- |
| Dashboard        | Home / Dashboard                                   |
| Pharmacy profile | Home / Dashboard / Pharmacy profile                |
| Orders           | Home / Dashboard / Orders                          |
| Order details    | Home / Dashboard / Orders / Order #12345           |
| Clients          | Home / Dashboard / Clients                         |
| Client details   | Home / Dashboard / Clients / Client name           |
| Own products     | Home / Dashboard / Own products                    |
| Product details  | Home / Dashboard / Own products / Product name     |
| All products     | Home / Dashboard / All products                    |
| Product requests | Home / Dashboard / Product requests                |
| Request details  | Home / Dashboard / product requests / Request name |

### Breadcrumb accessibility

Breadcrumbs must:

- be wrapped in `nav`;
- have `aria-label="Breadcrumbs"`;
- use `ul/li`;
- mark current page with `aria-current="page"`;
- use decorative separators with `aria-hidden="true"`.
