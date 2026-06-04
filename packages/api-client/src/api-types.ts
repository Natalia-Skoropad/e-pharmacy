import type {
  LoginPayload,
  ProductsQueryParams,
  RegisterPayload,
  UpdatePasswordPayload,
  UpdateProfilePayload,
} from '@e-pharmacy/types';

//===================================================================

export type { ApiErrorResponse, ApiSuccessResponse } from '@e-pharmacy/types';

//===================================================================

export type AuthApiPayloadMap = {
  register: RegisterPayload;
  login: LoginPayload;
  updateProfile: UpdateProfilePayload;
  updatePassword: UpdatePasswordPayload;
};

//===================================================================

export type ProductsListPathParams = ProductsQueryParams;
