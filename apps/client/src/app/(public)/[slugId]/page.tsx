import { notFound, permanentRedirect } from 'next/navigation';

import {
  createProductDetailMetadata,
  createStoreDetailMetadata,
  renderProductDetailPage,
  renderStoreDetailPage,
  resolveRootDetailBySlugId,
} from '@/lib/details';
import { createPageMetadata } from '@/lib/seo';

import type { Metadata } from 'next';

//===================================================================

type RootDetailsPageProps = {
  params: Promise<{
    slugId: string;
  }>;
  searchParams?: Promise<{
    storeId?: string;
  }>;
};

//===================================================================


function createProductCanonicalQueryString(storeId?: string): string {
  return storeId ? `?storeId=${encodeURIComponent(storeId)}` : '';
}

//===================================================================

export async function generateMetadata({
  params,
}: RootDetailsPageProps): Promise<Metadata> {
  const { slugId } = await params;
  const detail = await resolveRootDetailBySlugId(slugId);

  if (!detail) {
    return createPageMetadata({
      title: 'Page Not Found',
      description: 'The requested product or pharmacy could not be found.',
      path: `/${slugId}`,
      noIndex: true,
    });
  }

  if (detail.type === 'product') {
    return createProductDetailMetadata(detail.product);
  }

  return createStoreDetailMetadata(detail.store);
}

//===================================================================

async function RootDetailsPage({ params, searchParams }: RootDetailsPageProps) {
  const { slugId } = await params;
  const resolvedSearchParams = await searchParams;
  const detail = await resolveRootDetailBySlugId(slugId);

  if (!detail) notFound();

  if (!detail.isCanonicalSlug) {
    const queryString =
      detail.type === 'product'
        ? createProductCanonicalQueryString(resolvedSearchParams?.storeId)
        : '';

    permanentRedirect(`${detail.canonicalPath}${queryString}`);
  }

  if (detail.type === 'product') {
    return renderProductDetailPage(detail.product, resolvedSearchParams);
  }

  return renderStoreDetailPage(detail.store);
}

export default RootDetailsPage;
