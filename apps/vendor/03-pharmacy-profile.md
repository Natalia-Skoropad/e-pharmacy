# Vendor Technical Specification — Pharmacy Profile

## 1. General logic

Pharmacy profile is the Vendor page where the pharmacy can view and edit its own data according to current pharmacy status.

The page should be visually close to the Client profile page but with pharmacy-specific content and rules.

Use shared components wherever possible.

## 2. Pharmacy statuses

| Status          | Meaning                                                           | Who sets it                         |
| --------------- | ----------------------------------------------------------------- | ----------------------------------- |
| `new`           | Pharmacy registered but has not passed Admin moderation yet       | System after registration           |
| `active`        | Pharmacy passed moderation and can work                           | Admin                               |
| `on_moderation` | Active pharmacy changed important data and waits for Admin review | System after Vendor submits changes |
| `inactive`      | Pharmacy is blocked or temporarily disabled                       | Admin                               |

## 3. Status behavior

### New pharmacy

Can:

- enter Vendor cabinet;
- view own data;
- edit own data without moderation;
- view all Vendor-visible medicines from Admin.

Cannot:

- appear in Client;
- sell medicines;
- add medicines to own pharmacy;
- create medicine requests.

Banner:

```txt
Your pharmacy is not activated yet. Complete the required information and wait for Admin review.
```

### Active pharmacy

Can:

- enter Vendor cabinet;
- appear in Client;
- sell medicines;
- add active Admin medicines to own pharmacy;
- create medicine requests;
- view all Vendor-visible medicines from Admin;
- edit own data with Admin moderation.

If active pharmacy changes important data, public Client data and approved Vendor/Admin data must remain unchanged until Admin approves pending changes.

### Pharmacy on moderation

Can:

- enter Vendor cabinet;
- appear in Client with previous approved data;
- sell medicines;
- add active Admin medicines to own pharmacy;
- create medicine requests;
- view all Vendor-visible medicines from Admin;
- view approved data;
- view pending moderation data.

Cannot:

- edit data again until current pending changes are reviewed.

Banner:

```txt
Your changes are under moderation. Until Admin reviews them, Client pages show the previous approved data.
```

### Inactive pharmacy

Cannot:

- enter Vendor cabinet;
- appear in Client;
- sell medicines;
- add medicines;
- create medicine requests.

History is preserved:

- orders;
- clients;
- medicines;
- reviews;
- statistics.

Login message:

```txt
Your account is temporarily inactive. Please contact administration for details.
```

Admin must provide a required blocking reason when setting pharmacy status to `inactive`.

## 4. Approved data and pending data

Do not mix approved and pending data.

For `on_moderation` status:

- show previous approved data in normal profile fields;
- show pending data in separate pending moderation sections;
- each tab shows only its own pending fields.

Pending data by tab:

| Tab             | Pending fields                                 |
| --------------- | ---------------------------------------------- |
| Pharmacy data   | name, phone, address, working hours            |
| About pharmacy  | description                                    |
| Payment details | recipient, tax ID, IBAN, bank, payment purpose |

## 5. Page structure

Profile page includes:

- top page section with Breadcrumbs, `h1`, description, and status action;
- left summary sidebar;
- right content card with tabs.

Top title:

```txt
Pharmacy profile
```

Description:

```txt
Manage your pharmacy profile, contact details, payment details, and reviews.
```

For `new` pharmacy show button:

```txt
Send for moderation
```

This button is shown only for `new` status and is enabled only when all required fields across all tabs are completed and a photo is uploaded.

## 6. Left profile summary

Show:

- pharmacy photo;
- photo upload/change/remove controls;
- pharmacy name;
- email;
- rating and reviews count;
- role: Pharmacy;
- pharmacy status;
- status banner for `new`, `on_moderation`, and `inactive`.

Use:

- `ProfilePhotoCard`;
- `RatingSummary`;
- `AvatarImage` where needed.

Photo helper text:

```txt
Upload a lightweight JPG, PNG, or WEBP image up to 450 KB. The photo is saved to your profile right away.
```

## 7. Pharmacy photo rules

Photo is:

- optional for `new` and `inactive`;
- required for `active` and `on_moderation`.

For active pharmacy, photo change requires Admin moderation.

For new pharmacy, photo change does not require moderation.

Supported formats:

- JPG;
- PNG;
- WEBP.

Max size:

- 450 KB.

Component requirements:

- preview after selection;
- loading state while saving;
- error state;
- replace photo;
- remove photo when allowed by status.

Photo component and validation should be shared between Client, Vendor, and Admin.

## 8. Email

Email:

- is not editable in Vendor profile;
- is shown as readonly;
- is unique across Client, Vendor, and Admin;
- is used for login.

## 9. Profile tabs

Use shared `Tabs` component.

Tabs:

1. Pharmacy data;
2. About pharmacy;
3. Payment details;
4. Reviews.

## 10. Tab: Pharmacy data

Fields:

- Name;
- Phone;
- Address;
- Working hours;
- Current password;
- New password.

### Field rules

| Field         | Required for `new` | Required for `active` / `on_moderation` | Moderation for active pharmacy |
| ------------- | -----------------: | --------------------------------------: | -----------------------------: |
| Name          |                 No |                                     Yes |                            Yes |
| Phone         |                Yes |                                     Yes |                            Yes |
| Address       |                 No |                                     Yes |                            Yes |
| Working hours |                 No |                                     Yes |                            Yes |
| Password      |  By password rules |                       By password rules |                             No |

Phone must be unique across Client, Vendor, and Admin.

Working hours should use a shared common component:

```txt
WorkingHoursInput
```

Recommended format:

```txt
Mon–Fri: 08:00–20:00, Sat–Sun: 09:00–18:00
```

Password change does not require Admin moderation.

Password success toast:

```txt
Password changed successfully.
```

Password error:

```txt
Could not change password. Please try again.
```

### Save button labels

| Pharmacy status | Button              | State                                                   |
| --------------- | ------------------- | ------------------------------------------------------- |
| `new`           | Save                | Enabled only when changed and valid                     |
| `active`        | Send for moderation | Enabled only when changed and required fields are valid |
| `on_moderation` | Send for moderation | Disabled; fields disabled                               |
| `inactive`      | Not available       | Cabinet access blocked                                  |

Every save or send action opens `ConfirmActionModal`.

Success toasts:

```txt
Pharmacy data saved successfully.
Changes sent for moderation.
```

Error toast:

```txt
Could not save changes. Please try again.
```

## 11. Tab: About pharmacy

Field:

- pharmacy description.

Use common component:

```txt
TextEditor
```

Rules:

- optional for `new`;
- required for `active` and `on_moderation`;
- active pharmacy changes require Admin moderation;
- new pharmacy changes save immediately without moderation.

### TextEditor requirements

- max 5000 characters;
- character counter;
- simple formatting;
- paragraphs;
- line breaks;
- simple lists;
- bold text if implementation remains lightweight.

Save button follows the same status rules as the Pharmacy data tab.

## 12. Tab: Payment details

Fields:

- Recipient;
- EDRPOU / Tax ID;
- IBAN;
- Bank;
- Payment purpose.

Rules:

- optional for `new`;
- required for `active` and `on_moderation`;
- active pharmacy changes require Admin moderation;
- new pharmacy changes save immediately without moderation.

Unique fields:

- EDRPOU / Tax ID;
- IBAN.

Create reusable form-field components:

- `RecipientInput`;
- `TaxIdInput`;
- `IbanInput`;
- `BankInput`;
- `PaymentPurposeInput`.

## 13. Tab: Reviews

Vendor can only view pharmacy reviews.

Vendor cannot:

- create reviews;
- edit reviews;
- delete reviews;
- moderate reviews.

Reviews are moderated in Admin.

Use Client review styles where possible.

Show:

- client name;
- rating;
- date;
- review text;
- empty state.

Load more with:

```txt
LazyLoadButton
```

Empty state:

```txt
This pharmacy has no reviews yet.
```

## 14. Shared profile form rules

Buttons are disabled when:

- form is unchanged;
- validation errors exist;
- request is running;
- pharmacy has `on_moderation` status;
- pharmacy has `inactive` status.

Use disabled state for `on_moderation` fields.

Use `ConfirmActionModal` for:

- saving new pharmacy data;
- sending active pharmacy changes to moderation;
- password change;
- removing photo when the action is important or irreversible.
