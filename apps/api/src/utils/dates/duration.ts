export function parseDurationMs(value: string, fallbackMs: number): number {
  const match = value.trim().match(/^(\d+)(s|m|h|d)?$/i);

  if (!match) return fallbackMs;

  const amount = Number(match[1]);
  const unit = (match[2] || 'm').toLowerCase();

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * (multipliers[unit] || multipliers.m);
}
