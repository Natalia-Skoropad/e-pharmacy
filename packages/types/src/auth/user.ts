import type { EntityId, ISODateTimeString } from '../primitives';

import type {
  AdminAccountStatus,
  ClientAccountStatus,
  PharmacyOwnerAccountStatus,
} from './role';

//===================================================================

type AuthUserBase = Readonly<{
  id: EntityId;
  name: string;
  email: string;
  phone: string;
  address?: string;
  pictureUrl?: string;
  revision: ISODateTimeString;
}>;

//===================================================================

type ClientAuthUser = AuthUserBase &
  Readonly<{
    role: 'client';
    status: ClientAccountStatus;
  }>;

type PharmacyAuthUser = AuthUserBase &
  Readonly<{
    role: 'pharmacy';
    status: PharmacyOwnerAccountStatus;
  }>;

type AdminAuthUser = AuthUserBase &
  Readonly<{
    role: 'admin';
    status: AdminAccountStatus;
  }>;

//===================================================================

export type AuthUser = ClientAuthUser | PharmacyAuthUser | AdminAuthUser;
