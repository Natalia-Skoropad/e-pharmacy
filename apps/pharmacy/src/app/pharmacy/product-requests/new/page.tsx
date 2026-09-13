import type { Metadata } from 'next';

import { NewProductRequestPageContent } from '@/components/product-requests/NewProductRequestPageContent';
import { getProductRequestGenerationKey } from '@/components/product-requests/NewProductRequestPageContent/product-request-page-mode';

//===================================================================

export const metadata: Metadata = {
  title: 'New product request',
  description: 'Create a new product request draft.',
};

//===================================================================

type NewProductRequestPageProps = Readonly<{
  searchParams: Promise<{ source?: string | string[] }>;
}>;

//===================================================================

async function NewProductRequestPage({
  searchParams,
}: NewProductRequestPageProps) {
  const resolvedSearchParams = await searchParams;
  const source = resolvedSearchParams.source;
  const sourceRequestId = Array.isArray(source) ? source[0] : source;

  const generationKey = getProductRequestGenerationKey({
    sourceRequestId,
  });

  return (
    <NewProductRequestPageContent
      key={generationKey}
      sourceRequestId={sourceRequestId}
    />
  );
}

export default NewProductRequestPage;
