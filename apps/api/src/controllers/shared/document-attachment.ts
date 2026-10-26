/**
 * RFC 5987 filename* encoding for private document download headers.
 * The returned header has the same wire format as the pre-A1 controllers.
 * Authorization, cache policy and response body remain controller-owned.
 */
export function documentAttachmentDisposition(filename: string): string {
  const encoded = encodeURIComponent(filename).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );

  return `attachment; filename*=UTF-8''${encoded}`;
}
