import type { AuthUser } from '../src/auth';
import type { EntityId, ISODateTimeString } from '../src/primitives';

//===================================================================
// Auth status is role-aware: only pharmacy owners may be in onboarding `new`.

declare const id: EntityId;
declare const revision: ISODateTimeString;

//===================================================================

const common = {
  id,
  name: 'Owner',
  email: 'owner@example.com',
  phone: '+380000000000',
  revision,
} as const;

const newPharmacyOwner = {
  ...common,
  role: 'pharmacy',
  status: 'new',
} satisfies AuthUser;

void newPharmacyOwner;

//===================================================================

// @ts-expect-error Client accounts cannot use the pharmacy-owner onboarding status.
const newClient: AuthUser = {
  ...common,
  role: 'client',
  status: 'new',
};

void newClient;

//===================================================================

// @ts-expect-error Admin accounts cannot use the pharmacy-owner onboarding status.
const newAdmin: AuthUser = {
  ...common,
  role: 'admin',
  status: 'new',
};

void newAdmin;
