import type { UserRole, UserStatus, PharmacyAccountStatus } from './user';

//===============================================================

declare module 'express' {
  interface Request {
    authSessionId?: string;
    user?: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      status: UserStatus;
      pharmacyStatus?: PharmacyAccountStatus;
      phone?: string;
      address?: string;
      pictureUrl?: string;
    };
  }
}

//===============================================================

export {};
