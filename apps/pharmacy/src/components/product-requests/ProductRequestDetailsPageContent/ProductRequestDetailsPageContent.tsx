'use client';

import { NewProductRequestPageContent } from '../NewProductRequestPageContent';

//===================================================================

type ProductRequestDetailsPageContentProps = Readonly<{
  requestId: string;
}>;

//===================================================================

function ProductRequestDetailsPageContent({
  requestId,
}: ProductRequestDetailsPageContentProps) {
  return <NewProductRequestPageContent requestId={requestId} />;
}

export default ProductRequestDetailsPageContent;
export { ProductRequestDetailsPageContent };
