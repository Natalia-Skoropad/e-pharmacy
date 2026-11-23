import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { isValidObjectId } from '@e-pharmacy/validation/url';

import { ProductRequestDetailsPageContent } from '@/components/product-requests/ProductRequestDetailsPageContent';

//===================================================================

export const metadata: Metadata = {
  title: 'Product request details',
  description: 'Product request sections.',
};

//===================================================================

const tabs = {
  details: 'details',
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

  if (!isValidObjectId(requestId) || !(tab in tabs)) notFound();

  return (
    <ProductRequestDetailsPageContent
      requestId={requestId}
      initialTab={tabs[tab as keyof typeof tabs]}
    />
  );
}
