import { AllProductDetailsPageContent } from '@/components/all-products/AllProductDetailsPageContent';

import { getPharmacyProductsPath } from '@/lib/layout/routes';

//===================================================================

type OwnProductDetailsPageContentProps = Readonly<{
  productId: string;
}>;

//===================================================================

function OwnProductDetailsPageContent({
  productId,
}: OwnProductDetailsPageContentProps) {
  return (
    <AllProductDetailsPageContent
      productId={productId}
      backHref={getPharmacyProductsPath()}
      backLabel="Back to own products"
      pageDescription="View product details, stock, reserves, price, and sales statistics for your pharmacy."
      bannerTitle="Product management is locked for now"
      bannerMessage="You can review product details now. Price and stock management unlock after Admin verifies your pharmacy profile."
      productKicker="Own product"
      showAddAction={false}
      showRemoveAction
    />
  );
}

export default OwnProductDetailsPageContent;
export { OwnProductDetailsPageContent };
