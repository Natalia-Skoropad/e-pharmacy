import {
  resolveExternalAppConfiguration,
  type ExternalAppConfiguration,
  type ExternalAppConfigurationErrorCode,
  type ExternalAppConfigurationResult,
} from './external-app-config-core';

//===================================================================

export const ADMIN_DASHBOARD_PATH = '/admin/dashboard';
const ADMIN_ALLOWED_PATH_SEGMENT = '/admin';
export const DEVELOPMENT_ADMIN_APP_URL = 'http://localhost:3001';
const ADMIN_APP_ENV = 'NEXT_PUBLIC_ADMIN_APP_URL';

//===================================================================

export type AdminAppConfiguration = ExternalAppConfiguration;
export type AdminAppConfigurationErrorCode = ExternalAppConfigurationErrorCode;
export type AdminAppConfigurationResult = ExternalAppConfigurationResult;

//===================================================================

export class AdminAppConfigurationError extends Error {
  readonly code: AdminAppConfigurationErrorCode;

  constructor(code: AdminAppConfigurationErrorCode, message: string) {
    super(message);
    this.name = 'AdminAppConfigurationError';
    this.code = code;
  }
}

//===================================================================

export function resolveAdminAppConfiguration({
  configuredUrl,
  nodeEnv,
  clientSiteUrl,
}: Readonly<{
  configuredUrl: string | undefined;
  nodeEnv: string | undefined;
  clientSiteUrl: string;
}>): AdminAppConfigurationResult {
  return resolveExternalAppConfiguration({
    configuredUrl,
    nodeEnv,
    clientSiteUrl,
    developmentUrl: DEVELOPMENT_ADMIN_APP_URL,
    environmentVariable: ADMIN_APP_ENV,
    applicationLabel: 'admin',
    dashboardPath: ADMIN_DASHBOARD_PATH,
    allowedPathSegment: ADMIN_ALLOWED_PATH_SEGMENT,
  });
}
