import type { PharmacyRegistrationDocumentClaim } from '../pharmacies/verification-document';
import type { AuthApplication } from './application';
import type { UserRole } from './role';

//===================================================================

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  phone: string;
  address?: string;
  role?: Extract<UserRole, 'client' | 'pharmacy'>;
  pharmacyDocuments?: PharmacyRegistrationDocumentClaim[];
};

//===================================================================

export type LoginPayload = {
  email: string;
  password: string;
  application: Extract<AuthApplication, 'client' | 'pharmacy'>;
};

//===================================================================

export type ForgotPasswordPayload = {
  email: string;
  application: Extract<AuthApplication, 'client' | 'pharmacy'>;
};

export type ResetPasswordPayload = {
  token: string;
  newPassword: string;
};

export type UpdateProfilePayload = {
  name?: string;
  phone?: string;
  address?: string;
  pictureUrl?: string | null;
};

export type UpdatePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};
