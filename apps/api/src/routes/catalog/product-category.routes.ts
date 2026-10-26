import { Router } from 'express';

import { getPublicProductCategories } from '../../controllers/catalog/product-category.controller';
import { ctrlWrapper } from '../../utils/http/ctrlWrapper';

//===============================================================

export const productCategoryRoutes = Router();

//===============================================================

productCategoryRoutes.get('/', ctrlWrapper(getPublicProductCategories));
