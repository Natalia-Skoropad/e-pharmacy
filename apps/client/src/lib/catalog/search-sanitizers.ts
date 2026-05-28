export function sanitizeCatalogTextSearch(value: string): string {
  return value.replace(/[^A-Za-z0-9 .-]/g, '');
}

//===================================================================

export function sanitizeCatalogArticleSearch(value: string): string {
  return value.replace(/[^A-Za-z0-9.-]/g, '');
}
