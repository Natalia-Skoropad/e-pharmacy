import {
  isOptimizedProductionBuild,
  resolveClientPublicEnvironment,
  shouldRequireExplicitProductionSiteUrl,
  type ClientPublicEnvironment,
} from './public-environment';

//===================================================================

let cachedEnvironment: ClientPublicEnvironment | undefined;
let cachedCanonicalEnvironment: ClientPublicEnvironment | undefined;

//===================================================================

function getBrowserOrigin(): string | undefined {
  return typeof window === 'undefined' ? undefined : window.location.origin;
}

//===================================================================

function getDeploymentSiteUrl(): string | undefined {
  return process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
}

//===================================================================

function shouldAllowLocalProductionSiteUrl(): boolean {
  return (
    process.env.NEXT_PUBLIC_ALLOW_LOCAL_PRODUCTION_SITE_URL === 'true' ||
    isOptimizedProductionBuild(process.env.NEXT_PHASE)
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

    allowLocalProductionSiteUrl: shouldAllowLocalProductionSiteUrl(),
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

//===================================================================

export function getClientCanonicalEnvironment(): ClientPublicEnvironment {
  if (cachedCanonicalEnvironment) return cachedCanonicalEnvironment;

  const result = resolveClientPublicEnvironment({
    configuredSiteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    deploymentSiteUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    nodeEnv: process.env.NODE_ENV,

    requireExplicitProductionSiteUrl: shouldRequireExplicitProductionSiteUrl({
      nodeEnv: process.env.NODE_ENV,
      nextPhase: process.env.NEXT_PHASE,
      allowLocalProductionSiteUrl:
        process.env.NEXT_PUBLIC_ALLOW_LOCAL_PRODUCTION_SITE_URL,
    }),

    allowLocalProductionSiteUrl: shouldAllowLocalProductionSiteUrl(),
  });

  if (!result.ok) {
    throw new Error(`[${result.code}] ${result.message}`);
  }

  cachedCanonicalEnvironment = result.environment;
  return cachedCanonicalEnvironment;
}

//===================================================================

export function getClientCanonicalSiteUrl(): string {
  return getClientCanonicalEnvironment().siteUrl;
}
