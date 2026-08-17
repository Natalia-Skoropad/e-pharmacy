import type { EntityId, ISODateTimeString } from '../primitives';
import type { ProductCategory } from '../products';

//===================================================================

type CartProduct = Readonly<{
  id: EntityId;
  name: string;
  article: string;
  category: ProductCategory;
  price: number;
  imageUrl?: string;
  pharmacyName?: string;
  inStock: boolean;
  rating?: number;
  reviewsCount?: number;
}>;

//===================================================================

export type CartItem = Readonly<{
  id: EntityId;
  productOfferId: EntityId;
  productId: EntityId;
  pharmacyId: EntityId;
  product: CartProduct;
  pharmacyName: string;
  pharmacyImageUrl?: string;
  pharmacyRating?: number;
  pharmacyReviewsCount?: number;
  stockQuantity: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  expiresAt: ISODateTimeString;
}>;

//===================================================================

type CartIssueReason =
  | 'expired'
  | 'offer_unavailable'
  | 'product_unavailable'
  | 'pharmacy_unavailable';

export type CartIssue = Readonly<{
  cartItemId: EntityId;
  reason: CartIssueReason;
}>;

//===================================================================

export type Cart = Readonly<{
  revision: number;
  items: readonly CartItem[];
  totalItems: number;
  totalPrice: number;
  issues: readonly CartIssue[];
}>;
