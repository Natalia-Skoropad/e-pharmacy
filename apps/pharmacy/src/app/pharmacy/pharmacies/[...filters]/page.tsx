import { notFound, redirect } from 'next/navigation';

import {
  buildOwnedPharmaciesListUrl,
  buildOwnedPharmacyDetailUrl,
  parseOwnedPharmaciesListSegments,
  resolveOwnedPharmaciesRoute,
} from '@/lib/pharmacies/owned-pharmacy-url';

import { OwnedPharmaciesPageContent } from '@/components/pharmacies/OwnedPharmaciesPageContent/OwnedPharmaciesPageContent';
import { OwnedPharmacyDetailPageContent } from '@/components/pharmacies/OwnedPharmacyDetailPageContent/OwnedPharmacyDetailPageContent';

//===================================================================

export default async function OwnedPharmaciesRoute({
  params,
}: Readonly<{ params: Promise<{ filters: string[] }> }>) {
  const { filters } = await params;
  const route = resolveOwnedPharmaciesRoute(filters);

  if (route.kind === 'invalid') notFound();

  if (route.kind === 'detail') {
    const canonical = buildOwnedPharmacyDetailUrl(route.pharmacyId);

    if (`/pharmacy/pharmacies/${filters.join('/')}` !== canonical)
      redirect(canonical);

    return <OwnedPharmacyDetailPageContent pharmacyId={route.pharmacyId} />;
  }

  const state = parseOwnedPharmaciesListSegments(route.filters);
  const canonical = buildOwnedPharmaciesListUrl(state);

  if (`/pharmacy/pharmacies/${filters.join('/')}` !== canonical)
    redirect(canonical);

  return <OwnedPharmaciesPageContent initialState={state} />;
}
