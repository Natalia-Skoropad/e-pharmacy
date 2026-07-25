import { getNextApiServerEnvironment } from './env';

import {
  assertTrustedBackendPath,
  InvalidBackendPathError,
} from './trusted-backend-path';

//===================================================================

export { InvalidBackendPathError } from './trusted-backend-path';

//===================================================================

export function createTrustedBackendApiUrl(path: string): string {
  assertTrustedBackendPath(path);

  const { apiBaseUrl } = getNextApiServerEnvironment();
  const baseUrl = new URL(apiBaseUrl);
  const url = new URL(path, baseUrl);

  if (url.origin !== baseUrl.origin) {
    throw new InvalidBackendPathError(
      'Backend path changed the configured origin.'
    );
  }

  return url.toString();
}
