import { permanentRedirect } from 'next/navigation';

//===================================================================

type ProductLegacyDetailsPageProps = {
  params: Promise<{
    slugId: string;
  }>;
  searchParams?: Promise<{
    pharmacyId?: string;
  }>;
};

//===================================================================

function createProductLegacyQueryString(pharmacyId?: string): string {
  return pharmacyId ? `?pharmacyId=${encodeURIComponent(pharmacyId)}` : '';
}

//===================================================================

async function ProductLegacyDetailsPage({
  params,
  searchParams,
}: ProductLegacyDetailsPageProps) {
  const { slugId } = await params;
  const resolvedSearchParams = await searchParams;

  permanentRedirect(
    `/${slugId}${createProductLegacyQueryString(resolvedSearchParams?.pharmacyId)}`
  );
}

export default ProductLegacyDetailsPage;
