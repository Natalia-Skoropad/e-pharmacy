import { notFound, permanentRedirect } from 'next/navigation';

import {
  createProductDetailMetadata,
  createPharmacyDetailMetadata,
  renderProductDetailPage,
  renderPharmacyDetailPage,
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
    pharmacyId?: string;
  }>;
};

//===================================================================


function createProductCanonicalQueryString(pharmacyId?: string): string {
  return pharmacyId ? `?pharmacyId=${encodeURIComponent(pharmacyId)}` : '';
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

  return createPharmacyDetailMetadata(detail.pharmacy);
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
        ? createProductCanonicalQueryString(resolvedSearchParams?.pharmacyId)
        : '';

    permanentRedirect(`${detail.canonicalPath}${queryString}`);
  }

  if (detail.type === 'product') {
    return renderProductDetailPage(detail.product, resolvedSearchParams);
  }

  return renderPharmacyDetailPage(detail.pharmacy);
}

export default RootDetailsPage;
