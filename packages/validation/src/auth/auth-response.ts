import { USER_ROLES } from '@e-pharmacy/config/auth';
import { USER_STATUSES } from '@e-pharmacy/config/users';

import { buildEmailError, buildPhoneError } from '../shared';
import { buildPictureUrlError } from '../files/picture-validation';
import { isISODateTimeString } from '../dates';

import type {
  AuthResponse,
  AuthUser,
  UserRole,
  UserStatus,
} from '@e-pharmacy/types/auth';

//===================================================================

const AUTH_INVALID_RESPONSE_CODE = 'AUTH_INVALID_RESPONSE' as const;
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

//===================================================================

export class InvalidAuthResponseError extends Error {
  readonly code = AUTH_INVALID_RESPONSE_CODE;
  readonly status = 502;

  constructor(
    message = 'Authentication service returned an invalid response.'
  ) {
    super(message);
    this.name = 'InvalidAuthResponseError';
  }
}

//===================================================================

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

//===================================================================

function readRequiredString(
  value: Record<string, unknown>,
  key: keyof AuthUser
): string {
  const candidate = value[key];

  if (typeof candidate !== 'string' || candidate.trim().length === 0) {
    throw new InvalidAuthResponseError(
      `Authentication response field "${String(key)}" must be a non-empty string.`
    );
  }

  return candidate;
}

//===================================================================

function readOptionalString(
  value: Record<string, unknown>,
  key: 'address' | 'pictureUrl'
): string | undefined {
  const candidate = value[key];
  if (candidate === undefined) return undefined;

  if (typeof candidate !== 'string') {
    throw new InvalidAuthResponseError(
      `Authentication response field "${key}" must be a string when present.`
    );
  }

  return candidate;
}

//===================================================================

function isUserRole(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value);
}

//===================================================================

function isUserStatus(value: string): value is UserStatus {
  return (USER_STATUSES as readonly string[]).includes(value);
}

//===================================================================

export function parseAuthResponse(value: unknown): AuthResponse {
  if (!isRecord(value) || !isRecord(value.user)) {
    throw new InvalidAuthResponseError();
  }

  const source = value.user;
  const role = readRequiredString(source, 'role');
  const status = readRequiredString(source, 'status');

  if (!isUserRole(role)) {
    throw new InvalidAuthResponseError(
      'Authentication response contains an unsupported user role.'
    );
  }

  if (!isUserStatus(status)) {
    throw new InvalidAuthResponseError(
      'Authentication response contains an unsupported user status.'
    );
  }

  const id = readRequiredString(source, 'id');
  const email = readRequiredString(source, 'email');
  const phone = readRequiredString(source, 'phone');
  const revision = readRequiredString(source, 'revision');
  const address = readOptionalString(source, 'address');
  const pictureUrl = readOptionalString(source, 'pictureUrl');

  if (!OBJECT_ID_PATTERN.test(id)) {
    throw new InvalidAuthResponseError(
      'Authentication response contains an invalid user id.'
    );
  }

  if (
    buildEmailError(email) ||
    email !== email.trim() ||
    email !== email.toLowerCase()
  ) {
    throw new InvalidAuthResponseError(
      'Authentication response contains an invalid email.'
    );
  }

  if (!isISODateTimeString(revision)) {
    throw new InvalidAuthResponseError(
      'Authentication response contains an invalid revision timestamp.'
    );
  }

  if (
    buildPhoneError(phone, { required: true }) ||
    phone !== phone.trim()
  ) {
    throw new InvalidAuthResponseError(
      'Authentication response contains an invalid phone.'
    );
  }

  if (
    pictureUrl !== undefined &&
    (!pictureUrl.trim() || buildPictureUrlError(pictureUrl))
  ) {
    throw new InvalidAuthResponseError(
      'Authentication response contains an invalid picture URL.'
    );
  }

  return {
    user: {
      id,
      name: readRequiredString(source, 'name'),
      email,
      phone,
      role,
      status,
      revision,
      ...(address !== undefined ? { address } : {}),
      ...(pictureUrl !== undefined ? { pictureUrl } : {}),
    },
  };
}
