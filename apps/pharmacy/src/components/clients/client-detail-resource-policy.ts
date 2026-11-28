export type ClientDetailTab =
  | 'details'
  | 'statistics'
  | 'orders'
  | 'products'
  | 'comments'
  | 'pharmacies';

//===================================================================

export function shouldLoadClientProducts(
  activeTab: ClientDetailTab,
  loadedRequestKey: string | null,
  currentRequestKey: string
): boolean {
  return activeTab === 'products' && loadedRequestKey !== currentRequestKey;
}
