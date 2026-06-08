import type { UserRole, UserStatus, VendorAccountStatus } from './user';

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
      vendorStatus?: VendorAccountStatus;
      phone?: string;
      address?: string;
      pictureUrl?: string;
    };
  }
}

//===============================================================

export {};
