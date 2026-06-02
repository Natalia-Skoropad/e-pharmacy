# Vendor Technical Specification — Auth and Access

## 1. General auth strategy

Auth pages are shared global system pages, not a part of the `/vendor` route group.

Shared auth routes:

```txt
/auth/register
/auth/login
/auth/forgot-password
```

Vendor protected routes start with `/vendor`.

After login, a user with the `pharmacy` role is redirected to:

```txt
/vendor/dashboard
```

## 2. Account types

The system supports these account roles:

- `client`;
- `pharmacy`;
- `admin`.

Email and phone must be unique across all roles. The same email cannot belong to both a customer and a pharmacy. This allows login without a role selector.

## 3. Register page

The register page allows creating:

- a customer account;
- a pharmacy account.

Default selected account type: **Customer**.

The page must include an account type selector:

- Customer;
- Pharmacy.

Recommended UI pattern:

- radio buttons;
- segmented control;
- tabs-like switch.

### Customer registration fields

- name;
- email;
- phone;
- password.

After successful customer registration:

- a customer account is created;
- customer status becomes `active`;
- customer can use the Client cabinet and create orders.

### Pharmacy registration fields

- pharmacy name;
- email;
- phone;
- password;
- confirmation documents upload.

After successful pharmacy registration:

- a pharmacy account is created;
- pharmacy status becomes `new`;
- pharmacy can enter the Vendor cabinet;
- pharmacy cannot sell medicines, add medicines, or create medicine requests before Admin activation.

## 4. Pharmacy documents upload

The pharmacy registration form must include a required documents upload block.

### Text

Title:

```txt
Confirmation documents
```

Description:

```txt
Upload documents confirming that your pharmacy is allowed to sell medicines. Admin will review these documents before activating your pharmacy account.
```

The exact list of required legal documents should be clarified separately.

### Supported formats

- PDF;
- JPG;
- PNG;
- WEBP.

### Limits

- max file size: 5 MB per file;
- recommended max number of files: 5.

### UI requirements

Show:

- file name;
- file size;
- remove button before submit;
- wrong format error;
- file too large error;
- upload loading state.

### Validation message

```txt
Upload confirmation documents to register a pharmacy account.
```

## 5. Login page

The login page is shared for customers, pharmacies, and admins.

Fields:

- email;
- password.

After successful login, backend returns the user role.

Redirects:

| Role | Redirect |
|---|---|
| `client` | `/profile` |
| `pharmacy` | `/vendor/dashboard` |
| `admin` | `/admin/dashboard` |

## 6. Inactive pharmacy login

If pharmacy status is `inactive`, Vendor cabinet access is blocked.

Message:

```txt
Your account is temporarily inactive. Please contact administration for details.
```

## 7. New pharmacy login

If pharmacy status is `new`, login is allowed.

After login, redirect to:

```txt
/vendor/dashboard
```

Show banner:

```txt
Your pharmacy is not activated yet. Complete the required information and wait for Admin review.
```

New pharmacy can:

- enter the cabinet;
- view own data;
- edit own data without moderation;
- view all Admin medicines available to Vendor.

New pharmacy cannot:

- sell medicines;
- add medicines to own pharmacy;
- create medicine creation requests.

## 8. Forgot password page

The forgot password page is shared for customers, pharmacies, and admins.

Field:

- email.

Backend determines the account by email.

After submit, show a neutral message:

```txt
If an account with this email exists, we will send password recovery instructions.
```

Do not reveal whether the email exists in the system.

## 9. Redirect for already authenticated users

If an authenticated user opens an auth page, redirect by role:

| Role | Redirect |
|---|---|
| `client` | `/profile` |
| `pharmacy` | `/vendor/dashboard` |
| `admin` | `/admin/dashboard` |

## 10. Shared auth components

Use shared components:

- `Button`;
- `NameInput`;
- `EmailInput`;
- `PhoneInput`;
- `PasswordInput`;
- `FileUpload`;
- `LoadingSpinner`;
- `Toast`.

Create reusable account type component:

- `AccountTypeRadioGroup`; or
- `AccountTypeSegmentedControl`.

## 11. Auth messages

Success toasts:

```txt
Account created successfully.
Pharmacy account created. Please wait for Admin review.
You have successfully logged in.
If an account with this email exists, we will send password recovery instructions.
```

Error messages:

```txt
Invalid email or password.
This email is already in use.
This phone number is already in use.
Upload confirmation documents to register a pharmacy account.
The selected file format is not supported.
The selected file is too large.
The server is temporarily unavailable. Please try again later.
Something went wrong. Please try again.
```
