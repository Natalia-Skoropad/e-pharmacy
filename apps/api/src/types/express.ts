import type { UserRole, UserStatus, PharmacyStatus } from './user';

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
      pharmacyStatus?: PharmacyStatus;
      phone?: string;
      address?: string;
      pictureUrl?: string;
    };
  }
}

//===============================================================

export {};
