# pharmacy Technical Specification — Service Pages, Loaders, and States

## 1. General rule

pharmacy service pages and loaders should reuse the Client implementation as much as possible.

Do not create a separate pharmacy design if existing Client status pages can be reused.

Reuse:

- `Button`;
- `ButtonLink`;
- `Container`;
- `LoadingSpinner`;
- `status-page.module.css`;
- `loading.module.css` or shared loader styles;
- `/images/home/three-pills.png`.

Protected pharmacy layout does not show Footer.

Every service page must have one visible `<main>`.

## 2. Error page

Use `error.tsx`.

The page should match Client error page structure, styles, illustration, and responsive behavior.

### Structure

- one visible `main`;
- section with `aria-labelledby`;
- `Container`;
- text block;
- decorative illustration;
- Try again button;
- Back to dashboard link.

### Texts

Eyebrow:

```txt
Page error
```

Title:

```txt
Something went wrong, but your route is still safe
```

Text:

```txt
We could not load this page right now. Try again, or return to a stable section and continue working with your pharmacy cabinet.
```

Buttons:

```txt
Try again
Back to dashboard
```

Back link:

```txt
/pharmacy/dashboard
```

If error page is used inside public auth layout, secondary link may lead to `/auth/login` or `/`.

## 3. 404 page

Use `not-found.tsx`.

The page should match Client 404 page structure, styles, illustration, and responsive behavior.

### Texts

Eyebrow:

```txt
404
```

Title:

```txt
Page not found
```

Text:

```txt
The link may be outdated, moved, or typed with a small typo. Go back to dashboard or open medicines to continue working with your pharmacy cabinet.
```

Buttons:

```txt
Back to dashboard
View all medicines
```

Links:

```txt
/pharmacy/dashboard
/pharmacy/all-medicines
```

## 4. Route loading page

Use the same route loading approach as Client.

Example label:

```txt
Loading page...
```

The route loader should not create layout shifts.

## 5. LoadingSpinner

Use shared `LoadingSpinner` for:

- Dashboard;
- orders table;
- one order page;
  -clients table;
- one client page;
- own medicines table;
- all medicines table;
- medicine details page;
- requests table;
- request details page;
- create/edit request page;
- auth actions;
- async tabs.

Component requirements:

- `role="status"`;
- `aria-live="polite"`;
- decorative spinner with `aria-hidden="true"`;
- visible label or `aria-label`;
- optional `className`;
- default label: `Loading...`.

## 6. Loader placement

For full page loading, show loader in page content area.

For table loading, show loader inside the table area, not over the whole page, if only table data is loading.

For tab loading, show loader inside the active tab.

For button actions, show loading state on the button and disable it.

Common loading button texts:

```txt
Saving...
Sending...
Changing...
Loading...
Logging out...
```

## 7. Accessibility rules

Loaders must:

- have `role="status"`;
- use `aria-live="polite"` only where helpful;
- avoid stealing focus;
- avoid excessive live announcements;
- hide decorative spinner from screen readers.

Service pages must:

- have one visible `main`;
- have `h1`;
- connect section with heading through `aria-labelledby`;
- use decorative image with `aria-hidden="true"` and empty `alt`;
- use real buttons for actions;
- use real links for navigation.

## 8. Empty and nothing found states

Use empty state when there is no data at all.

Use nothing found state when data exists but filters return no results.

Common reset button:

```txt
Reset filters
```

Common retry button:

```txt
Try again
```
