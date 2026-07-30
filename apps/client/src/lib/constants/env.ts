import {
  resolveClientPublicEnvironment,
  type ClientPublicEnvironment,
} from './public-environment';

//===================================================================

let cachedEnvironment: ClientPublicEnvironment | undefined;

//===================================================================

function getBrowserOrigin(): string | undefined {
  return typeof window === 'undefined' ? undefined : window.location.origin;
}

//===================================================================

function getDeploymentSiteUrl(): string | undefined {
  return (
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL
  );
}

//===================================================================

export function getClientEnvironment(): ClientPublicEnvironment {
  if (cachedEnvironment) return cachedEnvironment;

  const result = resolveClientPublicEnvironment({
    configuredSiteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    runtimeSiteUrl: getBrowserOrigin(),
    deploymentSiteUrl: getDeploymentSiteUrl(),
    nodeEnv: process.env.NODE_ENV,
  });

  if (!result.ok) {
    throw new Error(`[${result.code}] ${result.message}`);
  }

  cachedEnvironment = result.environment;
  return cachedEnvironment;
}

//===================================================================

export function getClientSiteUrl(): string {
  return getClientEnvironment().siteUrl;
}
