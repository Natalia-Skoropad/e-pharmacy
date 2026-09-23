import { getTrustedExternalRedirectUrl } from '@e-pharmacy/auth/routing';

//===================================================================

const DEVELOPMENT_CLIENT_APP_URL = 'http://localhost:3000';
const DEVELOPMENT_PHARMACY_APP_URL = 'http://localhost:3002';
const PHARMACY_DASHBOARD_PATH = '/pharmacy/dashboard';

//===================================================================

type ExternalAppKind = 'client' | 'pharmacy';

//===================================================================

export type ExternalAppDestination = Readonly<{
  kind: ExternalAppKind;
  baseUrl: string;
  origin: string;
  basePath: string;
  destinationUrl: string;
  allowedPathPrefix: string;
}>;

export type ExternalAppDestinationErrorCode =
  | 'MISSING_URL'
  | 'INVALID_URL'
  | 'UNSUPPORTED_PROTOCOL'
  | 'INSECURE_PRODUCTION_URL'
  | 'CREDENTIALS_NOT_ALLOWED'
  | 'QUERY_OR_HASH_NOT_ALLOWED'
  | 'DASHBOARD_URL_INSTEAD_OF_BASE_URL';

export type ExternalAppDestinationResult =
  | Readonly<{ ok: true; config: ExternalAppDestination }>
  | Readonly<{
      ok: false;
      code: ExternalAppDestinationErrorCode;
      message: string;
    }>;

//===================================================================

function normalizeBasePath(pathname: string): string {
  if (pathname === '/') return '';
  return pathname.replace(/\/+$/, '');
}

//===================================================================

function getEnvironmentFallback(
  kind: ExternalAppKind,
  nodeEnv: string | undefined
): string | undefined {
  if (nodeEnv === 'production') return undefined;

  return kind === 'client'
    ? DEVELOPMENT_CLIENT_APP_URL
    : DEVELOPMENT_PHARMACY_APP_URL;
}

//===================================================================

function getEnvironmentVariableName(kind: ExternalAppKind): string {
  return kind === 'client'
    ? 'NEXT_PUBLIC_CLIENT_APP_URL'
    : 'NEXT_PUBLIC_PHARMACY_APP_URL';
}

//===================================================================

export function resolveExternalAppDestination({
  kind,
  configuredUrl,
  nodeEnv,
}: Readonly<{
  kind: ExternalAppKind;
  configuredUrl: string | undefined;
  nodeEnv: string | undefined;
}>): ExternalAppDestinationResult {
  const variableName = getEnvironmentVariableName(kind);
  const candidate =
    configuredUrl?.trim() || getEnvironmentFallback(kind, nodeEnv);

  if (!candidate) {
    return {
      ok: false,
      code: 'MISSING_URL',
      message: `${variableName} is required to open the ${kind} application.`,
    };
  }

  let appUrl: URL;

  try {
    appUrl = new URL(candidate);
  } catch {
    return {
      ok: false,
      code: 'INVALID_URL',
      message: `The ${kind} application URL is invalid.`,
    };
  }

  if (appUrl.protocol !== 'http:' && appUrl.protocol !== 'https:') {
    return {
      ok: false,
      code: 'UNSUPPORTED_PROTOCOL',
      message: `The ${kind} application URL must use HTTP or HTTPS.`,
    };
  }

  if (nodeEnv === 'production' && appUrl.protocol !== 'https:') {
    return {
      ok: false,
      code: 'INSECURE_PRODUCTION_URL',
      message: `The ${kind} application URL must use HTTPS in production.`,
    };
  }

  if (appUrl.username || appUrl.password) {
    return {
      ok: false,
      code: 'CREDENTIALS_NOT_ALLOWED',
      message: `The ${kind} application URL must not contain credentials.`,
    };
  }

  if (appUrl.search || appUrl.hash) {
    return {
      ok: false,
      code: 'QUERY_OR_HASH_NOT_ALLOWED',
      message: `${variableName} must be an application base URL without query parameters or a hash.`,
    };
  }

  const basePath = normalizeBasePath(appUrl.pathname);

  if (kind === 'pharmacy' && basePath.endsWith(PHARMACY_DASHBOARD_PATH)) {
    return {
      ok: false,
      code: 'DASHBOARD_URL_INSTEAD_OF_BASE_URL',
      message: `${variableName} must point to the pharmacy application base, not directly to its dashboard.`,
    };
  }

  const baseUrl = new URL(`${basePath || ''}/`, appUrl.origin).toString();

  if (kind === 'client') {
    return {
      ok: true,
      config: {
        kind,
        baseUrl,
        origin: appUrl.origin,
        basePath,
        destinationUrl: baseUrl,
        allowedPathPrefix: basePath || '/',
      },
    };
  }

  const pharmacyBasePath = `${basePath}/pharmacy`;

  return {
    ok: true,
    config: {
      kind,
      baseUrl,
      origin: appUrl.origin,
      basePath,
      destinationUrl: new URL(
        `${basePath}${PHARMACY_DASHBOARD_PATH}`,
        appUrl.origin
      ).toString(),
      allowedPathPrefix: pharmacyBasePath,
    },
  };
}

//===================================================================

export function getClientAppDestination(): ExternalAppDestinationResult {
  return resolveExternalAppDestination({
    kind: 'client',
    configuredUrl: process.env.NEXT_PUBLIC_CLIENT_APP_URL,
    nodeEnv: process.env.NODE_ENV,
  });
}

//===================================================================

export function getPharmacyAppDestination(): ExternalAppDestinationResult {
  return resolveExternalAppDestination({
    kind: 'pharmacy',
    configuredUrl: process.env.NEXT_PUBLIC_PHARMACY_APP_URL,
    nodeEnv: process.env.NODE_ENV,
  });
}

//===================================================================

function getConfiguredDestinations(): readonly ExternalAppDestination[] {
  const client = getClientAppDestination();
  const pharmacy = getPharmacyAppDestination();

  return [client, pharmacy]
    .filter(
      (
        result
      ): result is Readonly<{
        ok: true;
        config: ExternalAppDestination;
      }> => result.ok
    )
    .map((result) => result.config);
}

//===================================================================

export function resolveTrustedAdminExternalRedirectForDestinations(
  candidate: string,
  destinations: readonly ExternalAppDestination[]
): string | null {
  let candidateUrl: URL;

  try {
    candidateUrl = new URL(candidate);
  } catch {
    return null;
  }

  for (const config of destinations) {
    if (config.origin !== candidateUrl.origin) continue;

    const trustedUrl = getTrustedExternalRedirectUrl(candidate, {
      allowedOrigins: [config.origin],
      allowedPathPrefixes: [config.allowedPathPrefix],
    });

    if (trustedUrl) return trustedUrl;
  }

  return null;
}

//===================================================================

export function resolveTrustedAdminExternalRedirect(
  candidate: string
): string | null {
  return resolveTrustedAdminExternalRedirectForDestinations(
    candidate,
    getConfiguredDestinations()
  );
}
