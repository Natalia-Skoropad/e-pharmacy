export function isCurrentFavoriteRequest({
  currentVersion,
  requestVersion,
  aborted,
}: {
  currentVersion: number;
  requestVersion: number;
  aborted: boolean;
}): boolean {
  return currentVersion === requestVersion && !aborted;
}
