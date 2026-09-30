import type { Types } from 'mongoose';

import type {
  ProductCategoryKind,
  ProductCategoryStatus,
} from '../constants/product-category';

//===============================================================

export type ProductCategoryPersistenceEntity = {
  name: string;
  normalizedName: string;
  slug: string;
  status: ProductCategoryStatus;
  kind: ProductCategoryKind;
  sortOrder: number;
  createdBy: Types.ObjectId | null;
  updatedBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
};
