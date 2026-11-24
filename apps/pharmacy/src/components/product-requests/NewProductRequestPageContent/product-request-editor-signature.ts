import type { BrowserUploadFile } from '@e-pharmacy/ui/forms';
import type { ProductRequestFormValues } from '@e-pharmacy/validation/product-requests';

//===================================================================

// A saved signature includes document identity, not transient upload objects.
// The same function is used for new, loaded and just-saved requests.
export function getProductRequestEditorSignature(
  values: ProductRequestFormValues,
  productImage: readonly BrowserUploadFile[],
  additionalFiles: readonly BrowserUploadFile[]
): string {
  return JSON.stringify({
    values,

    image: productImage.map((file) => [
      file.documentId,
      file.dataUrl,
      file.name,
    ]),

    files: additionalFiles.map((file) => [
      file.documentId,
      file.name,
      file.size,
    ]),
  });
}
