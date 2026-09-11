const DEVELOPMENT_CLIENT_APP_URL = 'http://localhost:3000';

//===================================================================

export type ClientAppConfiguration = Readonly<{
  baseUrl: string;
  origin: string;
  basePath: string;
}>;

//===================================================================

export type ClientAppConfigurationErrorCode =
  | 'MISSING_URL'
  | 'INVALID_URL'
  | 'UNSUPPORTED_PROTOCOL'
  | 'INSECURE_PRODUCTION_URL'
  | 'CREDENTIALS_NOT_ALLOWED'
  | 'QUERY_OR_HASH_NOT_ALLOWED';

//===================================================================

export type ClientAppConfigurationResult =
  | Readonly<{ ok: true; config: ClientAppConfiguration }>
  | Readonly<{
      ok: false;
      code: ClientAppConfigurationErrorCode;
      message: string;
    }>;

//===================================================================

export class ClientAppConfigurationError extends Error {
  readonly code: ClientAppConfigurationErrorCode;

  constructor(code: ClientAppConfigurationErrorCode, message: string) {
    super(message);
    this.name = 'ClientAppConfigurationError';
    this.code = code;
  }
}

//===================================================================

function normalizeBasePath(pathname: string): string {
  if (pathname === '/') return '';
  return pathname.replace(/\/+$/, '');
}

//===================================================================

export function resolveClientAppConfiguration({
  configuredUrl,
  nodeEnv,
}: Readonly<{
  configuredUrl: string | undefined;
  nodeEnv: string | undefined;
}>): ClientAppConfigurationResult {
  const isProduction = nodeEnv === 'production';
  const candidate =
    configuredUrl?.trim() ||
    (isProduction ? undefined : DEVELOPMENT_CLIENT_APP_URL);

  if (!candidate) {
    return {
      ok: false,
      code: 'MISSING_URL',
      message:
        'NEXT_PUBLIC_CLIENT_APP_URL is required to open the client application.',
    };
  }

  let clientUrl: URL;

  try {
    clientUrl = new URL(candidate);
  } catch {
    return {
      ok: false,
      code: 'INVALID_URL',
      message: 'The client application URL is invalid.',
    };
  }

  if (clientUrl.protocol !== 'http:' && clientUrl.protocol !== 'https:') {
    return {
      ok: false,
      code: 'UNSUPPORTED_PROTOCOL',
      message: 'The client application URL must use HTTP or HTTPS.',
    };
  }

  if (isProduction && clientUrl.protocol !== 'https:') {
    return {
      ok: false,
      code: 'INSECURE_PRODUCTION_URL',
      message: 'The client application URL must use HTTPS in production.',
    };
  }

  if (clientUrl.username || clientUrl.password) {
    return {
      ok: false,
      code: 'CREDENTIALS_NOT_ALLOWED',
      message: 'The client application URL must not contain credentials.',
    };
  }

  if (clientUrl.search || clientUrl.hash) {
    return {
      ok: false,
      code: 'QUERY_OR_HASH_NOT_ALLOWED',
      message:
        'NEXT_PUBLIC_CLIENT_APP_URL must be an application base URL without query parameters or a hash.',
    };
  }

  const basePath = normalizeBasePath(clientUrl.pathname);
  const baseUrl = new URL(`${basePath || ''}/`, clientUrl.origin).toString();

  return {
    ok: true,
    config: {
      baseUrl,
      origin: clientUrl.origin,
      basePath,
    },
  };
}

//===================================================================

export function getClientAppConfiguration(): ClientAppConfigurationResult {
  return resolveClientAppConfiguration({
    configuredUrl: process.env.NEXT_PUBLIC_CLIENT_APP_URL,
    nodeEnv: process.env.NODE_ENV,
  });
}

//===================================================================

export function requireClientAppConfiguration(): ClientAppConfiguration {
  const result = getClientAppConfiguration();

  if (!result.ok) {
    throw new ClientAppConfigurationError(result.code, result.message);
  }

  return result.config;
}
