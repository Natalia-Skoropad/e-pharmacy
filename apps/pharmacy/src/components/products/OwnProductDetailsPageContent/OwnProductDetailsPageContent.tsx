import { AllProductDetailsPageContent } from '@/components/all-products/AllProductDetailsPageContent';

//===================================================================

type OwnProductDetailsPageContentProps = Readonly<{
  productId: string;
}>;

//===================================================================

function OwnProductDetailsPageContent({
  productId,
}: OwnProductDetailsPageContentProps) {
  return <AllProductDetailsPageContent productId={productId} mode="own" />;
}

export default OwnProductDetailsPageContent;
export { OwnProductDetailsPageContent };
