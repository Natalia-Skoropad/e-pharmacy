import 'server-only';

export {
  createProductDetailMetadata,
  lookupProductBySlugId,
  type ProductDetailLookupResult,
} from './server/product-detail-page';

export {
  createPharmacyDetailMetadata,
  lookupPharmacyBySlugId,
  type PharmacyDetailLookupResult,
} from './server/pharmacy-detail-page';

export {
  resolveRootDetailBySlugId,
  type RootDetail,
  type RootDetailResolveResult,
} from './server/root-detail-resolver';
