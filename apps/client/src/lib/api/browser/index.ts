import 'client-only';

export * from './auth.api';
export * from './cart.api';
export * from './health.api';
export * from './orders.api';
export * from './products.api';
export * from './pharmacies.api';

export {
  getProductsFromClientApi as getProducts,
  getFavoriteProductsFromClientApi as getFavoriteProducts,
  getFavoriteProductIdsFromClientApi as getFavoriteProductIds,
  getProductFiltersFromClientApi as getProductFilters,
  getProductDetailsFromClientApi as getProductDetails,
  getProductReviewsFromClientApi as getProductReviews,
} from './products.api';

export {
  getPharmaciesFromClientApi as getPharmacies,
  getFavoritePharmaciesFromClientApi as getFavoritePharmacies,
  getFavoritePharmacyIdsFromClientApi as getFavoritePharmacyIds,
  getPharmacyOptionsFromClientApi as getPharmacyOptions,
  getPharmacyFiltersFromClientApi as getPharmacyFilters,
  getPharmacyDetailsFromClientApi as getPharmacyDetails,
  getPharmacyReviewsFromClientApi as getPharmacyReviews,
} from './pharmacies.api';
