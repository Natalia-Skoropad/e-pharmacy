export type ManagedPhotoSize = 'thumb' | 'medium' | 'large';

//===================================================================

const MEDIA_URL = /^(\/api\/media\/[a-f0-9]{24}\/)(?:thumb|medium|large)$/;

//===================================================================

/** Non-managed seed, external and historical data URLs remain untouched. */
export function chooseManagedPhotoSize(
  source: string,
  size: ManagedPhotoSize
): string {
  return source.replace(
    MEDIA_URL,
    (_whole, prefix: string) => `${prefix}${size}`
  );
}
