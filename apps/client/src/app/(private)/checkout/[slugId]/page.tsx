import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';

import {
  CHECKOUT_DESCRIPTION,
  CHECKOUT_TITLE,
  createPageMetadata,
} from '@/lib/seo/server';

import {
  ROUTES,
  getCheckoutPharmacyIdFromPathParam,
  getLegacyCheckoutRedirectPath,
} from '@/lib/routes';

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
    path:
      getLegacyCheckoutRedirectPath(slugId) ?? `${ROUTES.CHECKOUT}/${slugId}`,
    noIndex: true,
  });
}

//===================================================================

async function CheckoutPharmacyPage({ params }: CheckoutPharmacyPageProps) {
  const { slugId } = await params;
  const checkoutPharmacyId = getCheckoutPharmacyIdFromPathParam(slugId);

  if (checkoutPharmacyId) {
    return <CheckoutPageContent checkoutPharmacyId={checkoutPharmacyId} />;
  }

  const legacyRedirectPath = getLegacyCheckoutRedirectPath(slugId);

  if (legacyRedirectPath) {
    permanentRedirect(legacyRedirectPath);
  }

  notFound();
}

export default CheckoutPharmacyPage;
