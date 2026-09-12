export function shouldRenderUserBadgePicture(
  pictureUrl: string | null | undefined,
  failedPictureUrl: string | null
): pictureUrl is string {
  return Boolean(pictureUrl) && pictureUrl !== failedPictureUrl;
}
