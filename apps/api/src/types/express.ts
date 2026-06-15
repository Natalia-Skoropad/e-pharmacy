import type { UserRole, UserStatus } from './user';

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
      phone?: string;
      address?: string;
      pictureUrl?: string;
    };
  }
}

//===============================================================

export {};
