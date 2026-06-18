import { notFound } from 'next/navigation';

import { CheckoutPageContent } from '@/components/checkout';

import { CHECKOUT_DESCRIPTION, CHECKOUT_TITLE } from '@/lib/seo';
import { ROUTES } from '@/lib/routes';
import { getIdFromSlugId } from '@/lib/routes';
import { createPageMetadata } from '@/lib/seo';

import { ProtectedRoute } from '@/routes';

import type { Metadata } from 'next';

//===================================================================

type CheckoutPharmacyPageProps = {
  params: Promise<{
    slugId: string;
  }>;
};

//===================================================================

export async function generateMetadata({
  params,
}: CheckoutPharmacyPageProps): Promise<Metadata> {
  const { slugId } = await params;

  return createPageMetadata({
    title: CHECKOUT_TITLE,
    description: CHECKOUT_DESCRIPTION,
    path: `${ROUTES.CHECKOUT}/${slugId}`,
    noIndex: true,
  });
}

//===================================================================

async function CheckoutPharmacyPage({ params }: CheckoutPharmacyPageProps) {
  const { slugId } = await params;
  const checkoutPharmacyId = getIdFromSlugId(slugId);

  if (!checkoutPharmacyId) {
    notFound();
  }

  const selectedPharmacyId = checkoutPharmacyId as string;

  return (
    <ProtectedRoute>
      <CheckoutPageContent checkoutPharmacyId={selectedPharmacyId} />
    </ProtectedRoute>
  );
}

export default CheckoutPharmacyPage;
