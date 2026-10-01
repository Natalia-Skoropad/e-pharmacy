import { Types } from 'mongoose';

import { ProductCategory } from '../models/productCategory.model';
import { ensureInitialProductCategories } from './product-category-bootstrap.service';

//===============================================================

// Test-only helper shared by Mongo integration tests that create Product records.
export async function getTestProductCategoryId(
  slug = 'medicine'
): Promise<Types.ObjectId> {
  await ensureInitialProductCategories();

  const category = await ProductCategory.findOne({ slug })
    .select('_id')
    .lean<{ _id: Types.ObjectId } | null>();

  if (!category) {
    throw new Error(`Test ProductCategory "${slug}" was not found.`);
  }

  return category._id;
}
