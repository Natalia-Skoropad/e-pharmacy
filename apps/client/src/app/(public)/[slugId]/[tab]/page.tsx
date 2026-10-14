import { cache } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';

import { parsePublicEntitySlugId } from '@e-pharmacy/validation/url';

import {
  createPharmacyDetailMetadata,
  lookupPharmacyBySlugId,
} from '@/lib/details';

import { buildPharmacyPath } from '@/lib/routes';

import { DetailsUnavailablePage } from '@/components/common/DetailsUnavailablePage';
import type { PharmacyTab } from '@/components/pharmacies/PharmacyDetailsPageContent/PharmacyDetailsTabs';
import { PharmacyDetailPage } from '@/components/pharmacies/server/PharmacyDetailPage';

//===================================================================

const resolvePharmacy = cache(lookupPharmacyBySlugId);

const pharmacyTabs: Readonly<Record<string, PharmacyTab>> = {
  about: 'about',
  reviews: 'reviews',
  'bank-details': 'payment',
};

type Props = Readonly<{
  params: Promise<{ slugId: string; tab: string }>;
}>;

//===================================================================

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slugId, tab } = await params;

  if (
    !pharmacyTabs[tab] ||
    parsePublicEntitySlugId(slugId)?.entityType !== 'pharmacy'
  ) {
    return {};
  }

  const result = await resolvePharmacy(slugId);
  return result.status === 'found'
    ? createPharmacyDetailMetadata(result.pharmacy)
    : {};
}

//===================================================================

export default async function PharmacyTabPage({ params }: Props) {
  const { slugId, tab } = await params;
  const activeTab = pharmacyTabs[tab];

  if (
    !activeTab ||
    parsePublicEntitySlugId(slugId)?.entityType !== 'pharmacy'
  ) {
    notFound();
  }

  const result = await resolvePharmacy(slugId);
  if (result.status === 'unavailable') {
    return <DetailsUnavailablePage entityLabel="pharmacy" error={result} />;
  }
  if (result.status === 'not_found') notFound();

  const canonical = buildPharmacyPath(
    result.pharmacy.name,
    result.pharmacy.id,
    result.pharmacy.publicSlugId
  );
  if (canonical !== `/${slugId}`) {
    permanentRedirect(`${canonical}/${tab}`);
  }

  return (
    <PharmacyDetailPage pharmacy={result.pharmacy} initialTab={activeTab} />
  );
}
