import { USER_ROLES } from '@e-pharmacy/config/auth';
import { USER_STATUSES } from '@e-pharmacy/config/users';

import type {
  AuthResponse,
  AuthUser,
  UserRole,
  UserStatus,
} from '@e-pharmacy/types/auth';

//===================================================================

const AUTH_INVALID_RESPONSE_CODE = 'AUTH_INVALID_RESPONSE' as const;

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

  const address = readOptionalString(source, 'address');
  const pictureUrl = readOptionalString(source, 'pictureUrl');

  return {
    user: {
      id: readRequiredString(source, 'id'),
      name: readRequiredString(source, 'name'),
      email: readRequiredString(source, 'email'),
      phone: readRequiredString(source, 'phone'),
      role,
      status,
      ...(address !== undefined ? { address } : {}),
      ...(pictureUrl !== undefined ? { pictureUrl } : {}),
    },
  };
}
