import { notFound } from 'next/navigation';

import { ProtectedRoute } from '@/components/auth';
import { CheckoutPageContent } from '@/components/cart';

import { CHECKOUT_DESCRIPTION, CHECKOUT_TITLE } from '@/lib/constants/metadata';
import { getIdFromSlugId } from '@/lib/routes';
import { createPageMetadata } from '@/lib/seo';

import type { Metadata } from 'next';

//===================================================================

type CheckoutStorePageProps = {
  params: Promise<{
    slugId: string;
  }>;
};

//===================================================================

export function generateMetadata(): Metadata {
  return createPageMetadata({
    title: CHECKOUT_TITLE,
    description: CHECKOUT_DESCRIPTION,
    path: '/checkout',
    noIndex: true,
  });
}

//===================================================================

async function CheckoutStorePage({ params }: CheckoutStorePageProps) {
  const { slugId } = await params;
  const checkoutStoreId = getIdFromSlugId(slugId);

  if (!checkoutStoreId) {
    notFound();
  }

  return (
    <ProtectedRoute>
      <CheckoutPageContent checkoutStoreId={checkoutStoreId} />
    </ProtectedRoute>
  );
}

export default CheckoutStorePage;
