import { getClientSiteUrl } from '@/lib/constants/env';

import {
  PharmacyAppConfigurationError,
  resolvePharmacyAppConfiguration,
  type PharmacyAppConfiguration,
  type PharmacyAppConfigurationResult,
} from './pharmacy-app-config-core';

export {
  PharmacyAppConfigurationError,
  resolvePharmacyAppConfiguration,
} from './pharmacy-app-config-core';

export type {
  PharmacyAppConfiguration,
  PharmacyAppConfigurationErrorCode,
  PharmacyAppConfigurationResult,
} from './pharmacy-app-config-core';

//===================================================================

export function getPharmacyAppConfiguration(): PharmacyAppConfigurationResult {
  return resolvePharmacyAppConfiguration({
    configuredUrl: process.env.NEXT_PUBLIC_PHARMACY_APP_URL,
    nodeEnv: process.env.NODE_ENV,
    clientSiteUrl: getClientSiteUrl(),
  });
}

//===================================================================

export function requirePharmacyAppConfiguration(): PharmacyAppConfiguration {
  const result = getPharmacyAppConfiguration();

  if (!result.ok) {
    throw new PharmacyAppConfigurationError(result.code, result.message);
  }

  return result.config;
}

//===================================================================

export function isPharmacyAppConfigurationError(
  error: unknown
): error is PharmacyAppConfigurationError {
  return error instanceof PharmacyAppConfigurationError;
}
