import 'client-only';

import type {
  AuthResponse,
  AuthUser,
  CurrentUserResponse,
  LoginPayload,
} from '@e-pharmacy/types';

//===================================================================

export const DEMO_PHARMACY_EMAIL = 'pharmacy.demo@e-pharmacy.test';
export const DEMO_PHARMACY_PASSWORD = 'Pharmacy123!';

const DEMO_PHARMACY_STORAGE_KEY = 'e-pharmacy:pharmacy:demo-user';

const DEMO_PHARMACY_USER: AuthUser = {
  id: 'demo-pharmacy-001',
  name: 'Green Cross Pharmacy',
  email: DEMO_PHARMACY_EMAIL,
  role: 'pharmacy',
  status: 'active',
  phone: '+380 44 000 00 01',
  address: 'Kyiv, Demo street, 12',
};

//===================================================================

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

//===================================================================

function readStoredDemoUser(): AuthUser | null {
  if (!canUseLocalStorage()) return null;

  try {
    const rawValue = window.localStorage.getItem(DEMO_PHARMACY_STORAGE_KEY);
    if (!rawValue) return null;

    const parsedValue = JSON.parse(rawValue) as Partial<AuthUser>;

    if (parsedValue.role !== 'pharmacy' || parsedValue.status === 'blocked') {
      return null;
    }

    return {
      ...DEMO_PHARMACY_USER,
      ...parsedValue,
      role: 'pharmacy',
      status: 'active',
    };
  } catch {
    return null;
  }
}

//===================================================================

function storeDemoUser(user: AuthUser) {
  if (!canUseLocalStorage()) return;
  window.localStorage.setItem(DEMO_PHARMACY_STORAGE_KEY, JSON.stringify(user));
}

//===================================================================

export function clearDemoPharmacyUser() {
  if (!canUseLocalStorage()) return;
  window.localStorage.removeItem(DEMO_PHARMACY_STORAGE_KEY);
}

//===================================================================

export function getDemoPharmacyCredentials() {
  return {
    email: DEMO_PHARMACY_EMAIL,
    password: DEMO_PHARMACY_PASSWORD,
  };
}

//===================================================================

export async function loginDemoPharmacyUser(
  payload: LoginPayload
): Promise<AuthResponse | null> {
  const isDemoLogin =
    payload.email.trim().toLowerCase() === DEMO_PHARMACY_EMAIL &&
    payload.password === DEMO_PHARMACY_PASSWORD;

  if (!isDemoLogin) return null;

  storeDemoUser(DEMO_PHARMACY_USER);
  return { user: DEMO_PHARMACY_USER };
}

//===================================================================

export async function getDemoCurrentPharmacyUser(): Promise<CurrentUserResponse | null> {
  const user = readStoredDemoUser();
  return user ? { user } : null;
}
