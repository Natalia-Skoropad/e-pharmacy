import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
} from '@e-pharmacy/types/auth';

//===================================================================

export type AuthProviderServices = {
  getCurrentUser: () => Promise<AuthResponse>;
  refreshSession: () => Promise<AuthResponse>;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register?: (payload: RegisterPayload) => Promise<AuthResponse>;
  logout: () => Promise<void>;
};
