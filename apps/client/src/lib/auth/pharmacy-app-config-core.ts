import { resolveExternalAppConfiguration } from './external-app-config-core';

//===================================================================

const PHARMACY_DASHBOARD_PATH = '/pharmacy/dashboard';
const PHARMACY_ALLOWED_PATH_SEGMENT = '/pharmacy';
const DEVELOPMENT_PHARMACY_APP_URL = 'http://localhost:3002';
const PHARMACY_APP_ENV = 'NEXT_PUBLIC_PHARMACY_APP_URL';

//===================================================================

export type PharmacyAppConfiguration = Readonly<{
  baseUrl: string;
  origin: string;
  dashboardUrl: string;
  allowedPathPrefix: string;
}>;

//===================================================================

export type PharmacyAppConfigurationErrorCode =
  | 'MISSING_URL'
  | 'INVALID_URL'
  | 'UNSUPPORTED_PROTOCOL'
  | 'INSECURE_PRODUCTION_URL'
  | 'CREDENTIALS_NOT_ALLOWED'
  | 'QUERY_OR_HASH_NOT_ALLOWED'
  | 'SAME_ORIGIN_NOT_ALLOWED'
  | 'DASHBOARD_URL_INSTEAD_OF_BASE_URL';

//===================================================================

export type PharmacyAppConfigurationResult =
  | Readonly<{ ok: true; config: PharmacyAppConfiguration }>
  | Readonly<{
      ok: false;
      code: PharmacyAppConfigurationErrorCode;
      message: string;
    }>;

//===================================================================

export class PharmacyAppConfigurationError extends Error {
  readonly code: PharmacyAppConfigurationErrorCode;

  constructor(code: PharmacyAppConfigurationErrorCode, message: string) {
    super(message);
    this.name = 'PharmacyAppConfigurationError';
    this.code = code;
  }
}

//===================================================================

export function resolvePharmacyAppConfiguration({
  configuredUrl,
  nodeEnv,
  clientSiteUrl,
}: Readonly<{
  configuredUrl: string | undefined;
  nodeEnv: string | undefined;
  clientSiteUrl: string;
}>): PharmacyAppConfigurationResult {
  return resolveExternalAppConfiguration({
    configuredUrl,
    nodeEnv,
    clientSiteUrl,
    developmentUrl: DEVELOPMENT_PHARMACY_APP_URL,
    environmentVariable: PHARMACY_APP_ENV,
    applicationLabel: 'pharmacy',
    dashboardPath: PHARMACY_DASHBOARD_PATH,
    allowedPathSegment: PHARMACY_ALLOWED_PATH_SEGMENT,
  });
}
