import 'server-only';

export {
  createProductDetailMetadata,
  lookupProductBySlugId,
  resolveProductBySlugId,
  type ProductDetailLookupResult,
} from './server/product-detail-page';

export {
  createPharmacyDetailMetadata,
  lookupPharmacyBySlugId,
  type PharmacyDetailLookupResult,
} from './server/pharmacy-detail-page';

