import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import {
  CHECKOUT_DESCRIPTION,
  CHECKOUT_TITLE,
  createPageMetadata,
} from '@/lib/seo/server';

import { ROUTES } from '@/lib/routes';
import { getIdFromSlugId } from '@e-pharmacy/validation/url';
import { CheckoutPageContent } from '@/components/checkout';

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

  return <CheckoutPageContent checkoutPharmacyId={selectedPharmacyId} />;
}

export default CheckoutPharmacyPage;
