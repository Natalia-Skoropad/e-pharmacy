const LOCAL_SITE_URL = 'http://localhost:3000';
const NEXT_PRODUCTION_BUILD_PHASE = 'phase-production-build';

//===================================================================

export type ClientPublicEnvironment = Readonly<{
  siteUrl: string;
}>;

//===================================================================

export type ClientPublicEnvironmentErrorCode =
  | 'INVALID_SITE_URL'
  | 'UNSUPPORTED_PROTOCOL'
  | 'INSECURE_PRODUCTION_URL'
  | 'CREDENTIALS_NOT_ALLOWED'
  | 'QUERY_OR_HASH_NOT_ALLOWED'
  | 'BASE_PATH_NOT_ALLOWED'
  | 'MISSING_PRODUCTION_SITE_URL'
  | 'LOCAL_PRODUCTION_URL_NOT_ALLOWED';

//===================================================================

export type ClientPublicEnvironmentResult =
  | Readonly<{ ok: true; environment: ClientPublicEnvironment }>
  | Readonly<{
      ok: false;
      code: ClientPublicEnvironmentErrorCode;
      message: string;
    }>;

//===================================================================

function normalizeDeploymentSiteUrl(
  value: string | undefined
): string | undefined {
  const candidate = value?.trim();
  if (!candidate) return undefined;

  return /^[a-z][a-z\d+.-]*:\/\//i.test(candidate)
    ? candidate
    : `https://${candidate}`;
}

//===================================================================

function isLoopbackHostname(hostname: string): boolean {
  return (
    hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
  );
}

//===================================================================

export function isOptimizedProductionBuild(
  nextPhase: string | undefined
): boolean {
  return nextPhase === NEXT_PRODUCTION_BUILD_PHASE;
}

//===================================================================

export function shouldRequireExplicitProductionSiteUrl({
  nodeEnv,
  nextPhase,
  allowLocalProductionSiteUrl,
}: Readonly<{
  nodeEnv: string | undefined;
  nextPhase?: string | undefined;
  allowLocalProductionSiteUrl: string | undefined;
}>): boolean {
  return (
    nodeEnv === 'production' &&
    !isOptimizedProductionBuild(nextPhase) &&
    allowLocalProductionSiteUrl?.trim() !== 'true'
  );
}

//===================================================================

export function resolveClientPublicEnvironment({
  configuredSiteUrl,
  runtimeSiteUrl,
  deploymentSiteUrl,
  nodeEnv,
  requireExplicitProductionSiteUrl = false,
  allowLocalProductionSiteUrl = false,
}: Readonly<{
  configuredSiteUrl: string | undefined;
  runtimeSiteUrl?: string | undefined;
  deploymentSiteUrl?: string | undefined;
  nodeEnv: string | undefined;
  requireExplicitProductionSiteUrl?: boolean;
  allowLocalProductionSiteUrl?: boolean;
}>): ClientPublicEnvironmentResult {
  const isProduction = nodeEnv === 'production';

  if (
    isProduction &&
    requireExplicitProductionSiteUrl &&
    !configuredSiteUrl?.trim() &&
    !deploymentSiteUrl?.trim()
  ) {
    return {
      ok: false,
      code: 'MISSING_PRODUCTION_SITE_URL',
      message:
        'NEXT_PUBLIC_SITE_URL or a trusted production deployment origin is required for the canonical URL.',
    };
  }

  const candidate =
    configuredSiteUrl?.trim() ||
    runtimeSiteUrl?.trim() ||
    normalizeDeploymentSiteUrl(deploymentSiteUrl) ||
    LOCAL_SITE_URL;

  let url: URL;

  try {
    url = new URL(candidate);
  } catch {
    return {
      ok: false,
      code: 'INVALID_SITE_URL',
      message: 'NEXT_PUBLIC_SITE_URL must be an absolute URL.',
    };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return {
      ok: false,
      code: 'UNSUPPORTED_PROTOCOL',
      message: 'NEXT_PUBLIC_SITE_URL must use HTTP or HTTPS.',
    };
  }

  if (
    isProduction &&
    isLoopbackHostname(url.hostname) &&
    !allowLocalProductionSiteUrl
  ) {
    return {
      ok: false,
      code: 'LOCAL_PRODUCTION_URL_NOT_ALLOWED',
      message:
        'A localhost site URL in production requires an explicit local-build opt-in.',
    };
  }

  if (
    isProduction &&
    url.protocol !== 'https:' &&
    !isLoopbackHostname(url.hostname)
  ) {
    return {
      ok: false,
      code: 'INSECURE_PRODUCTION_URL',
      message: 'NEXT_PUBLIC_SITE_URL must use HTTPS in production.',
    };
  }

  if (url.username || url.password) {
    return {
      ok: false,
      code: 'CREDENTIALS_NOT_ALLOWED',
      message: 'NEXT_PUBLIC_SITE_URL must not contain credentials.',
    };
  }

  if (url.search || url.hash) {
    return {
      ok: false,
      code: 'QUERY_OR_HASH_NOT_ALLOWED',
      message:
        'NEXT_PUBLIC_SITE_URL must not contain query parameters or a hash.',
    };
  }

  if (url.pathname !== '/' && url.pathname !== '') {
    return {
      ok: false,
      code: 'BASE_PATH_NOT_ALLOWED',
      message: 'NEXT_PUBLIC_SITE_URL must contain only the application origin.',
    };
  }

  return {
    ok: true,
    environment: { siteUrl: url.origin },
  };
}
