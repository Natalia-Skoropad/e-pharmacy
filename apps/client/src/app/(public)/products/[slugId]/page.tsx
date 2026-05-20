import { permanentRedirect } from 'next/navigation';

//===================================================================

type ProductLegacyDetailsPageProps = {
  params: Promise<{
    slugId: string;
  }>;
  searchParams?: Promise<{
    storeId?: string;
  }>;
};

//===================================================================

function createProductLegacyQueryString(storeId?: string): string {
  return storeId ? `?storeId=${encodeURIComponent(storeId)}` : '';
}

//===================================================================

async function ProductLegacyDetailsPage({
  params,
  searchParams,
}: ProductLegacyDetailsPageProps) {
  const { slugId } = await params;
  const resolvedSearchParams = await searchParams;

  permanentRedirect(
    `/${slugId}${createProductLegacyQueryString(resolvedSearchParams?.storeId)}`
  );
}

export default ProductLegacyDetailsPage;
