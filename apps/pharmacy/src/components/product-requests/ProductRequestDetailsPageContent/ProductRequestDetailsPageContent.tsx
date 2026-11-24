'use client';

import { NewProductRequestPageContent } from '../NewProductRequestPageContent';
import { getProductRequestGenerationKey } from '../NewProductRequestPageContent/product-request-page-mode';

//===================================================================

type ProductRequestDetailsPageContentProps = Readonly<{
  requestId: string;

  initialTab?:
    | 'details'
    | 'product-data'
    | 'characteristics'
    | 'full-description'
    | 'note-for-admin'
    | 'documents'
    | 'comments'
    | 'activity';
}>;

//===================================================================

function ProductRequestDetailsPageContent({
  requestId,
  initialTab,
}: ProductRequestDetailsPageContentProps) {
  return (
    <NewProductRequestPageContent
      key={getProductRequestGenerationKey({ requestId })}
      requestId={requestId}
      initialTab={initialTab}
    />
  );
}

export default ProductRequestDetailsPageContent;
export { ProductRequestDetailsPageContent };
