import { notFound } from 'next/navigation';

import { CheckoutPageContent } from '@/components/checkout';

import { CHECKOUT_DESCRIPTION, CHECKOUT_TITLE } from '@/lib/constants/metadata';
import { ROUTES } from '@/lib/constants/routes';
import { getIdFromSlugId } from '@/lib/routes';
import { createPageMetadata } from '@/lib/seo';

import { ProtectedRoute } from '@/routes';

import type { Metadata } from 'next';

//===================================================================

type CheckoutStorePageProps = {
  params: Promise<{
    slugId: string;
  }>;
};

//===================================================================

export async function generateMetadata({
  params,
}: CheckoutStorePageProps): Promise<Metadata> {
  const { slugId } = await params;

  return createPageMetadata({
    title: CHECKOUT_TITLE,
    description: CHECKOUT_DESCRIPTION,
    path: `${ROUTES.CHECKOUT}/${slugId}`,
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
