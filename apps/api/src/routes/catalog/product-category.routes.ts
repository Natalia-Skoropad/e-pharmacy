import { Router } from 'express';

import { getPublicProductCategories } from '../../controllers/catalog/product-category.controller';
import { ctrlWrapper } from '../../utils/ctrlWrapper';

//===============================================================

export const productCategoryRoutes = Router();

//===============================================================

productCategoryRoutes.get('/', ctrlWrapper(getPublicProductCategories));
