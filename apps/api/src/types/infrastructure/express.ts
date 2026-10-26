import type { AdminAuthorization } from '../admin/access/admin-access';
import type { UserRole, UserStatus } from '../accounts/user';

//===============================================================

declare module 'express' {
  interface Request {
    authSessionId?: string;
    adminAuthorization?: AdminAuthorization;

    user?: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      status: UserStatus;
      phone?: string;
      address?: string;
      pictureUrl?: string;
    };
  }
}

//===============================================================

export {};
