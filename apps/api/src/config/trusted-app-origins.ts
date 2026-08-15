function normalizeTrustedOrigin(value: string, source: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${source} must contain valid absolute URLs`);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`${source} must use http or https URLs`);
  }

  if (url.username || url.password) {
    throw new Error(`${source} must not contain URL credentials`);
  }

  return url.origin;
}

//===============================================================

export function buildTrustedAppOrigins(options: {
  appUrls: readonly (string | undefined)[];
  extraOrigins?: readonly string[];
  localOrigins?: readonly string[];
}): string[] {
  const normalized = [
    ...options.appUrls.map((value) => ({ value, source: 'application URL' })),
    ...(options.extraOrigins ?? []).map((value) => ({
      value,
      source: 'TRUSTED_APP_ORIGINS',
    })),
    ...(options.localOrigins ?? []).map((value) => ({
      value,
      source: 'local trusted origin',
    })),
  ]
    .filter(
      (entry): entry is { value: string; source: string } =>
        typeof entry.value === 'string' && entry.value.trim().length > 0
    )
    .map((entry) => normalizeTrustedOrigin(entry.value.trim(), entry.source));

  return Array.from(new Set(normalized));
}
