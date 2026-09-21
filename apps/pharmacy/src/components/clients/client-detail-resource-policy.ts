export type ClientDetailTab = 'details' | 'orders' | 'products' | 'comments';

//===================================================================

export function shouldLoadClientProducts(
  activeTab: ClientDetailTab,
  loadedRequestKey: string | null,
  currentRequestKey: string
): boolean {
  return activeTab === 'products' && loadedRequestKey !== currentRequestKey;
}
