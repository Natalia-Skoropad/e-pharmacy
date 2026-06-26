# Pharmacy profile — current implementation notes

## Goal

`/pharmacy/profile` is the private pharmacy owner profile page. The route file is `apps/pharmacy/src/app/pharmacy/(protected)/profile/page.tsx`. It follows the same visual structure as the client profile page: page header, breadcrumbs, left summary card, right tabbed content card.

The page does not show the pharmacy cabinet side menu. The pharmacy owner opens it from the user badge in the pharmacy header.

## Shared components

The page must use shared package components instead of pharmacy-local UI copies:

- `Container`, `Button`, `Tabs`, `PictureCard`, `ReviewsList`, `TextEditor`, `WorkingHoursInput` from `@e-pharmacy/ui/common`;
- `NameInput`, `PhoneInput`, `AddressInput`, `EmailInput`, `PasswordInput`, `CommentInput`, `TaxIdInput`, `IbanInput` from `@e-pharmacy/ui/form-fields`;
- `Breadcrumbs` from `@e-pharmacy/ui/layout`;
- `PageLoader` / `LoadingSpinner` for loading states.

## Validation

All profile form validation must come from `@e-pharmacy/validation`.

Do not duplicate local validators in `apps/pharmacy` for:

- owner name;
- phone;
- email;
- password;
- address;
- working hours;
- pharmacy description;
- Tax ID / EDRPOU;
- IBAN;
- payment purpose.

`TaxIdInput` and `IbanInput` are reusable UI fields, and their validation is defined in `packages/validation`.

## Tabs

### My data

Owner account data. This tab is not moderated.

Fields:

- name;
- phone;
- current password;
- new password.

### Pharmacy data

Public pharmacy contact data. Required before verification.

Fields:

- pharmacy photo;
- address;
- phone;
- email;
- working hours.

### About pharmacy

Public text about the pharmacy. Required before verification.

Uses the reusable `TextEditor` component from `packages/ui/common/TextEditor`.

### Payment details

Payment data required before verification.

Fields:

- recipient name;
- Tax ID / EDRPOU;
- IBAN;
- bank name;
- receipt email;
- payment purpose.

### Reviews

Readonly pharmacy reviews. Uses shared `ReviewsList`, which uses the existing `formatReviewDate` formatter from `@e-pharmacy/utils/formatters`.

### Active sessions

The same concept as client profile active sessions. Shows active devices and a revoke action.

## Moderation rules

- `new` pharmacy can edit required data and send the profile for verification when required fields are valid.
- `on_moderation` pharmacy sees data as readonly until admin decision.
- `active` pharmacy can later send moderated changes again.

## Deleted local pharmacy UI

The folder `apps/pharmacy/src/components/pharmacy` is no longer part of the profile implementation and should be removed. Reusable blocks live in packages.
