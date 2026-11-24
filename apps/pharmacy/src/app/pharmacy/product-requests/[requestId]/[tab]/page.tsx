import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { isValidObjectId } from '@e-pharmacy/validation/url';

import {
  isProductRequestsFilterRoute,
  buildProductRequestsPath,
  parseProductRequestsSegments,
  parseProductRequestsPaginationSegments,
} from '@/lib/product-requests/product-request-paths';

import { ProductRequestsPageContent } from '@/components/product-requests/ProductRequestsPageContent';
import { ProductRequestDetailsPageContent } from '@/components/product-requests/ProductRequestDetailsPageContent';

//===================================================================

export const metadata: Metadata = {
  title: 'Product request details',
  description: 'Product request sections.',
};

//===================================================================

const tabs = {
  details: 'details',
  'product-data': 'product-data',
  characteristics: 'characteristics',
  'about-product': 'full-description',
  'note-for-admin': 'note-for-admin',
  documents: 'documents',
  comments: 'comments',
  activity: 'activity',
} as const;

//===================================================================

export default async function ProductRequestTabPage({
  params,
}: Readonly<{ params: Promise<{ requestId: string; tab: string }> }>) {
  const { requestId, tab } = await params;

  // Next.js prefers /[requestId]/[tab] to the optional list catch-all for
  // two-segment URLs (for example date-from/date-to or status/per-page).
  const segments = [requestId, tab];

  if (isProductRequestsFilterRoute(segments)) {
    const params = { filters: segments };
    const initialFilters = parseProductRequestsSegments(params);
    const initialPagination = parseProductRequestsPaginationSegments(params);

    const canonical = buildProductRequestsPath(
      initialFilters,
      initialPagination
    );

    if (`/pharmacy/product-requests/${segments.join('/')}` !== canonical) {
      redirect(canonical);
    }

    return (
      <ProductRequestsPageContent
        key={JSON.stringify([initialFilters, initialPagination])}
        initialFilters={initialFilters}
        initialPagination={initialPagination}
      />
    );
  }

  if (!isValidObjectId(requestId) || !Object.hasOwn(tabs, tab)) notFound();

  // The overview uses the same canonical root URL as All products.
  if (tab === 'details') redirect(`/pharmacy/product-requests/${requestId}`);

  return (
    <ProductRequestDetailsPageContent
      requestId={requestId}
      initialTab={tabs[tab as keyof typeof tabs]}
    />
  );
}
