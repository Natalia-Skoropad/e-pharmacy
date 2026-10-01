import { apiRoutes as API_ROUTES } from '@e-pharmacy/api-client/contracts';
import { createPrivateProxyRoute } from '@e-pharmacy/next-api/proxy';

//===================================================================

type AdminProductCategoryRouteParams = {
  categoryId: string;
};

//===================================================================

export const PATCH = createPrivateProxyRoute<AdminProductCategoryRouteParams>({
  backendPath: ({ categoryId }) =>
    API_ROUTES.admin.productCategories.details(categoryId),
  method: 'PATCH',
});

//===================================================================

export const DELETE = createPrivateProxyRoute<AdminProductCategoryRouteParams>({
  backendPath: ({ categoryId }) =>
    API_ROUTES.admin.productCategories.details(categoryId),
  method: 'DELETE',
});
