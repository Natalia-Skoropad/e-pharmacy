'use client';

import { NewProductRequestPageContent } from '../NewProductRequestPageContent';
import { getProductRequestGenerationKey } from '../NewProductRequestPageContent/product-request-page-mode';

//===================================================================

type ProductRequestDetailsPageContentProps = Readonly<{
  requestId: string;
}>;

//===================================================================

function ProductRequestDetailsPageContent({
  requestId,
}: ProductRequestDetailsPageContentProps) {
  return (
    <NewProductRequestPageContent
      key={getProductRequestGenerationKey({ requestId })}
      requestId={requestId}
    />
  );
}

export default ProductRequestDetailsPageContent;
export { ProductRequestDetailsPageContent };
