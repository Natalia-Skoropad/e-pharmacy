import type { UserRole } from '@e-pharmacy/types';

//===================================================================

export type AuthAppKind = 'client' | 'vendor' | 'admin';

export type AuthRedirects = {
  loginPath: string;
  afterLoginPath: string;
  afterLogoutPath?: string;
  forbiddenPath?: string;
};

export type AuthAccessConfig = {
  app: AuthAppKind;
  allowedRoles: readonly UserRole[];
  redirects: AuthRedirects;
};
