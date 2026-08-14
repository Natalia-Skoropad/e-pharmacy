export type CapturedResetPasswordToken = Readonly<{
  token: string;
  sanitizedUrl: string;
}>;

//===================================================================

function captureTokenFromHash(hash: string): {
  token: string;
  sanitizedHash: string;
} {
  if (!hash) return { token: '', sanitizedHash: '' };

  const rawHash = hash.startsWith('#') ? hash.slice(1) : hash;
  const params = new URLSearchParams(rawHash);

  if (!params.has('token')) {
    return { token: '', sanitizedHash: hash };
  }

  const token = params.get('token')?.trim() ?? '';
  params.delete('token');

  const sanitizedParams = params.toString();

  return {
    token,
    sanitizedHash: sanitizedParams ? `#${sanitizedParams}` : '',
  };
}

//===================================================================

export function captureResetPasswordToken(
  href: string
): CapturedResetPasswordToken {
  const url = new URL(href);
  const queryToken = url.searchParams.get('token')?.trim() ?? '';
  const hashCapture = captureTokenFromHash(url.hash);

  url.searchParams.delete('token');
  url.hash = hashCapture.sanitizedHash;

  return {
    token: hashCapture.token || queryToken,
    sanitizedUrl: `${url.pathname}${url.search}${url.hash}`,
  };
}
