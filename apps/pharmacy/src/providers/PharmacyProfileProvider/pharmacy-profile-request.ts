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
