import type { EntityId, ISODateTimeString } from '../primitives';
import type { ProductCategory } from '../products';

//===================================================================

export type CartProduct = {
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
};

//===================================================================

export type CartItem = {
  id: EntityId;
  productOfferId: EntityId;
  productId: EntityId;
  pharmacyId: EntityId;
  product: CartProduct;
  pharmacyName: string;
  pharmacyRating?: number;
  pharmacyReviewsCount?: number;
  stockQuantity: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  expiresAt: ISODateTimeString;
};

//===================================================================

export type Cart = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
};
