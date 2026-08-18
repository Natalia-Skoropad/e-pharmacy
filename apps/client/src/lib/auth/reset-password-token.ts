export type CapturedResetPasswordToken = Readonly<{
  token: string;
  sanitizedUrl: string;
  historyState: Record<string, unknown>;
}>;

//===================================================================

const RESET_PASSWORD_HISTORY_STATE_KEY = '__ePharmacyResetPasswordToken';

//===================================================================

function toHistoryStateRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

//===================================================================

function getTokenFromHistoryState(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '';

  const token = (value as Record<string, unknown>)[
    RESET_PASSWORD_HISTORY_STATE_KEY
  ];

  return typeof token === 'string' ? token.trim() : '';
}

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
  href: string,
  currentHistoryState?: unknown
): CapturedResetPasswordToken {
  const url = new URL(href);
  const queryToken = url.searchParams.get('token')?.trim() ?? '';
  const hashCapture = captureTokenFromHash(url.hash);
  const historyToken = getTokenFromHistoryState(currentHistoryState);
  const token = hashCapture.token || queryToken || historyToken;
  const historyState = toHistoryStateRecord(currentHistoryState);

  url.searchParams.delete('token');
  url.hash = hashCapture.sanitizedHash;

  if (token) {
    historyState[RESET_PASSWORD_HISTORY_STATE_KEY] = token;
  }

  return {
    token,
    sanitizedUrl: `${url.pathname}${url.search}${url.hash}`,
    historyState,
  };
}

//===================================================================

export function clearResetPasswordTokenFromHistoryState(
  currentHistoryState: unknown
): Record<string, unknown> {
  const historyState = toHistoryStateRecord(currentHistoryState);
  delete historyState[RESET_PASSWORD_HISTORY_STATE_KEY];

  return historyState;
}
