export function shouldSyncProfileForm({
  previousUserId,
  nextUserId,
  isDirty,
}: Readonly<{
  previousUserId: string | null;
  nextUserId: string;
  isDirty: boolean;
}>): boolean {
  return previousUserId !== nextUserId || !isDirty;
}
