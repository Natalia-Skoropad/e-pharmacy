import { getClientSiteUrl } from '@/lib/constants/env';

import {
  AdminAppConfigurationError,
  resolveAdminAppConfiguration,
  type AdminAppConfiguration,
  type AdminAppConfigurationResult,
} from './admin-app-config-core';

export {
  AdminAppConfigurationError,
  resolveAdminAppConfiguration,
} from './admin-app-config-core';

export type {
  AdminAppConfiguration,
  AdminAppConfigurationErrorCode,
  AdminAppConfigurationResult,
} from './admin-app-config-core';

//===================================================================

export function getAdminAppConfiguration(): AdminAppConfigurationResult {
  return resolveAdminAppConfiguration({
    configuredUrl: process.env.NEXT_PUBLIC_ADMIN_APP_URL,
    nodeEnv: process.env.NODE_ENV,
    clientSiteUrl: getClientSiteUrl(),
  });
}

//===================================================================

export function requireAdminAppConfiguration(): AdminAppConfiguration {
  const result = getAdminAppConfiguration();

  if (!result.ok) {
    throw new AdminAppConfigurationError(result.code, result.message);
  }

  return result.config;
}

//===================================================================

export function isAdminAppConfigurationError(
  error: unknown
): error is AdminAppConfigurationError {
  return error instanceof AdminAppConfigurationError;
}

//===================================================================

export function getAdminDashboardUrl(): string | null {
  const result = getAdminAppConfiguration();
  return result.ok ? result.config.dashboardUrl : null;
}
