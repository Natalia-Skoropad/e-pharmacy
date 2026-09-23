export type ExternalAppConfiguration = Readonly<{
  baseUrl: string;
  origin: string;
  dashboardUrl: string;
  allowedPathPrefix: string;
}>;

//===================================================================

export type ExternalAppConfigurationErrorCode =
  | 'MISSING_URL'
  | 'INVALID_URL'
  | 'UNSUPPORTED_PROTOCOL'
  | 'INSECURE_PRODUCTION_URL'
  | 'CREDENTIALS_NOT_ALLOWED'
  | 'QUERY_OR_HASH_NOT_ALLOWED'
  | 'SAME_ORIGIN_NOT_ALLOWED'
  | 'DASHBOARD_URL_INSTEAD_OF_BASE_URL';

//===================================================================

export type ExternalAppConfigurationResult =
  | Readonly<{ ok: true; config: ExternalAppConfiguration }>
  | Readonly<{
      ok: false;
      code: ExternalAppConfigurationErrorCode;
      message: string;
    }>;

//===================================================================

function normalizeBasePath(pathname: string): string {
  if (pathname === '/') return '';
  return pathname.replace(/\/+$/, '');
}

//===================================================================

export function resolveExternalAppConfiguration({
  configuredUrl,
  nodeEnv,
  clientSiteUrl,
  developmentUrl,
  environmentVariable,
  applicationLabel,
  dashboardPath,
  allowedPathSegment,
}: Readonly<{
  configuredUrl: string | undefined;
  nodeEnv: string | undefined;
  clientSiteUrl: string;
  developmentUrl: string;
  environmentVariable: string;
  applicationLabel: string;
  dashboardPath: string;
  allowedPathSegment: string;
}>): ExternalAppConfigurationResult {
  const isProduction = nodeEnv === 'production';
  const candidate =
    configuredUrl?.trim() || (isProduction ? undefined : developmentUrl);

  if (!candidate) {
    return {
      ok: false,
      code: 'MISSING_URL',
      message: `${environmentVariable} is required to open the ${applicationLabel} application.`,
    };
  }

  let externalUrl: URL;
  let clientUrl: URL;

  try {
    externalUrl = new URL(candidate);
    clientUrl = new URL(clientSiteUrl);
  } catch {
    return {
      ok: false,
      code: 'INVALID_URL',
      message: `The ${applicationLabel} application URL is invalid.`,
    };
  }

  if (externalUrl.protocol !== 'http:' && externalUrl.protocol !== 'https:') {
    return {
      ok: false,
      code: 'UNSUPPORTED_PROTOCOL',
      message: `The ${applicationLabel} application URL must use HTTP or HTTPS.`,
    };
  }

  if (isProduction && externalUrl.protocol !== 'https:') {
    return {
      ok: false,
      code: 'INSECURE_PRODUCTION_URL',
      message: `The ${applicationLabel} application URL must use HTTPS in production.`,
    };
  }

  if (externalUrl.username || externalUrl.password) {
    return {
      ok: false,
      code: 'CREDENTIALS_NOT_ALLOWED',
      message: `The ${applicationLabel} application URL must not contain credentials.`,
    };
  }

  if (externalUrl.search || externalUrl.hash) {
    return {
      ok: false,
      code: 'QUERY_OR_HASH_NOT_ALLOWED',
      message: `${environmentVariable} must be an application base URL without query parameters or a hash.`,
    };
  }

  if (externalUrl.origin === clientUrl.origin) {
    return {
      ok: false,
      code: 'SAME_ORIGIN_NOT_ALLOWED',
      message: `The ${applicationLabel} application URL must not use the client application origin.`,
    };
  }

  const basePath = normalizeBasePath(externalUrl.pathname);

  if (basePath.endsWith(dashboardPath)) {
    return {
      ok: false,
      code: 'DASHBOARD_URL_INSTEAD_OF_BASE_URL',
      message: `${environmentVariable} must point to the ${applicationLabel} application base, not directly to its dashboard.`,
    };
  }

  const dashboardUrl = new URL(
    `${basePath}${dashboardPath}`,
    externalUrl.origin
  ).toString();

  return {
    ok: true,
    config: {
      baseUrl: new URL(basePath || '/', externalUrl.origin).toString(),
      origin: externalUrl.origin,
      dashboardUrl,
      allowedPathPrefix: `${basePath}${allowedPathSegment}`,
    },
  };
}
