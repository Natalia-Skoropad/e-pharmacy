export function getTelephoneHref(value: string | undefined): string | null {
  if (!value) return null;

  const compact = value.trim().replace(/[^+\d]/g, '');

  if (!/^\+?\d{7,15}$/.test(compact)) return null;

  return `tel:${compact}`;
}
