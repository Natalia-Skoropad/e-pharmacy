export function invalidatePharmacyProfileRequest({
  currentVersion,
  controller,
}: Readonly<{
  currentVersion: number;
  controller: AbortController | null;
}>): number {
  controller?.abort();
  return currentVersion + 1;
}

//===================================================================

export function isCurrentPharmacyProfileRequest({
  currentIdentity,
  requestIdentity,
  currentVersion,
  requestVersion,
  aborted,
}: Readonly<{
  currentIdentity: string | null;
  requestIdentity: string;
  currentVersion: number;
  requestVersion: number;
  aborted: boolean;
}>): boolean {
  return (
    !aborted &&
    currentIdentity === requestIdentity &&
    currentVersion === requestVersion
  );
}
