export function formatInitials(
  name?: string | null,
  fallback = 'EP'
): string {
  const initials = (name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return initials || fallback;
}
