const PHARMACY_DASHBOARD_PATH = '/pharmacy/dashboard';
const DEVELOPMENT_PHARMACY_APP_URL = 'http://localhost:3002';

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

function normalizeBasePath(pathname: string): string {
  if (pathname === '/') return '';
  return pathname.replace(/\/+$/, '');
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
  const isProduction = nodeEnv === 'production';
  const candidate =
    configuredUrl?.trim() ||
    (isProduction ? undefined : DEVELOPMENT_PHARMACY_APP_URL);

  if (!candidate) {
    return {
      ok: false,
      code: 'MISSING_URL',
      message:
        'NEXT_PUBLIC_PHARMACY_APP_URL is required to open the pharmacy application.',
    };
  }

  let pharmacyUrl: URL;
  let clientUrl: URL;

  try {
    pharmacyUrl = new URL(candidate);
    clientUrl = new URL(clientSiteUrl);
  } catch {
    return {
      ok: false,
      code: 'INVALID_URL',
      message: 'The pharmacy application URL is invalid.',
    };
  }

  if (pharmacyUrl.protocol !== 'http:' && pharmacyUrl.protocol !== 'https:') {
    return {
      ok: false,
      code: 'UNSUPPORTED_PROTOCOL',
      message: 'The pharmacy application URL must use HTTP or HTTPS.',
    };
  }

  if (isProduction && pharmacyUrl.protocol !== 'https:') {
    return {
      ok: false,
      code: 'INSECURE_PRODUCTION_URL',
      message: 'The pharmacy application URL must use HTTPS in production.',
    };
  }

  if (pharmacyUrl.username || pharmacyUrl.password) {
    return {
      ok: false,
      code: 'CREDENTIALS_NOT_ALLOWED',
      message: 'The pharmacy application URL must not contain credentials.',
    };
  }

  if (pharmacyUrl.search || pharmacyUrl.hash) {
    return {
      ok: false,
      code: 'QUERY_OR_HASH_NOT_ALLOWED',
      message:
        'NEXT_PUBLIC_PHARMACY_APP_URL must be an application base URL without query parameters or a hash.',
    };
  }

  if (pharmacyUrl.origin === clientUrl.origin) {
    return {
      ok: false,
      code: 'SAME_ORIGIN_NOT_ALLOWED',
      message:
        'The pharmacy application URL must not use the client application origin.',
    };
  }

  const basePath = normalizeBasePath(pharmacyUrl.pathname);

  if (basePath.endsWith(PHARMACY_DASHBOARD_PATH)) {
    return {
      ok: false,
      code: 'DASHBOARD_URL_INSTEAD_OF_BASE_URL',
      message:
        'NEXT_PUBLIC_PHARMACY_APP_URL must point to the pharmacy application base, not directly to its dashboard.',
    };
  }

  const dashboardPath = `${basePath}${PHARMACY_DASHBOARD_PATH}`;
  const allowedPathPrefix = `${basePath}/pharmacy`;
  const dashboardUrl = new URL(dashboardPath, pharmacyUrl.origin).toString();
  const baseUrl = new URL(basePath || '/', pharmacyUrl.origin).toString();

  return {
    ok: true,
    config: {
      baseUrl,
      origin: pharmacyUrl.origin,
      dashboardUrl,
      allowedPathPrefix,
    },
  };
}

//===================================================================
