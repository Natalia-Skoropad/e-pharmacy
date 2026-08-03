export const CATALOG_SEARCH_UPDATE_DELAY = 450;

/**
 * Local SearchableSelect remains acceptable while the complete pharmacy option
 * list stays below this documented threshold. Crossing it requires a remote,
 * paginated pharmacy-options endpoint rather than silently shipping a larger
 * client payload.
 */
export const CATALOG_REMOTE_PHARMACY_SEARCH_THRESHOLD = 250;
