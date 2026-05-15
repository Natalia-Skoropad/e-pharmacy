import type { UserRole, UserStatus } from './user';

//===============================================================

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: UserRole;
        status: UserStatus;
        phone?: string;
        address?: string;
        avatarUrl?: string;
      };
    }
  }
}

//===============================================================

export {};
