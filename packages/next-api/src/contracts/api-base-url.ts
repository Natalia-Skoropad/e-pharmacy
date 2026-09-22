export type NodeEnvironment = 'development' | 'test' | 'production';

//===================================================================

export type ApiBaseUrlOptions = Readonly<{
  allowInsecureLoopbackInProduction?: boolean;
}>;

//===================================================================

const LOCAL_API_BASE_URL = 'http://localhost:4000';
const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);

//===================================================================

export function resolveNodeEnvironment(
  value: string | undefined
): NodeEnvironment {
  const nodeEnv = value ?? 'development';

  if (
    nodeEnv === 'development' ||
    nodeEnv === 'test' ||
    nodeEnv === 'production'
  ) {
    return nodeEnv;
  }

  throw new Error('NODE_ENV must be development, test, or production.');
}

//===================================================================

export function resolveApiBaseUrl(
  configuredValue: string | undefined,
  nodeEnv: NodeEnvironment,
  options: ApiBaseUrlOptions = {}
): string {
  const configured = configuredValue?.trim();
  const value =
    configured || (nodeEnv === 'production' ? '' : LOCAL_API_BASE_URL);

  if (!value) {
    throw new Error('API_BASE_URL is required in production.');
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error('API_BASE_URL must be a valid absolute URL.');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('API_BASE_URL must use http or https.');
  }

  const allowInsecureLoopback =
    options.allowInsecureLoopbackInProduction === true &&
    LOOPBACK_HOSTNAMES.has(url.hostname);

  if (
    nodeEnv === 'production' &&
    url.protocol !== 'https:' &&
    !allowInsecureLoopback
  ) {
    throw new Error('API_BASE_URL must use https in production.');
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new Error(
      'API_BASE_URL must not contain credentials, query, or hash.'
    );
  }

  return url.toString();
}
