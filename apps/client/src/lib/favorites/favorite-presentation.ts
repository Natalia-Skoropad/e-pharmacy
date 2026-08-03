export type FavoriteEntityType = 'product' | 'pharmacy';

//===================================================================

export type FavoritePresentationCapabilities = Readonly<{
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  canUseClientFeatures: boolean;
}>;

//===================================================================

export function shouldRenderFavoriteControl({
  isAuthenticated,
  isBootstrapping,
  canUseClientFeatures,
}: FavoritePresentationCapabilities): boolean {
  return !isBootstrapping && (!isAuthenticated || canUseClientFeatures);
}

//===================================================================

export function getFavoriteActionCopy(entityType: FavoriteEntityType) {
  const entityLabel = entityType === 'product' ? 'product' : 'pharmacy';
  const pluralLabel = entityType === 'product' ? 'products' : 'pharmacies';

  return {
    loginMessage: `Please log in to add ${pluralLabel} to favorites.`,

    unavailableMessage:
      'We could not verify your session. Please try again shortly.',

    clientAccountRequiredMessage:
      'Favorites are available only for active client accounts.',
    addedMessage: `${entityLabel[0].toUpperCase()}${entityLabel.slice(1)} was added to favorites.`,

    removedMessage: `${entityLabel[0].toUpperCase()}${entityLabel.slice(1)} was removed from favorites.`,

    errorMessage:
      entityType === 'product'
        ? 'Could not update favorites.'
        : 'Could not update pharmacy favorites.',
  } as const;
}
