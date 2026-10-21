import type { Metadata } from 'next';

import { parseOwnedPharmaciesListSearchParams } from '@/lib/pharmacies/owned-pharmacy-url';

import { OwnedPharmaciesPageContent } from '@/components/pharmacies/OwnedPharmaciesPageContent/OwnedPharmaciesPageContent';

//===================================================================

export const metadata: Metadata = {
  title: 'Pharmacies',
  description: 'View pharmacies accessible to your account.',
};

//===================================================================

type Props = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

//===================================================================

export default async function OwnedPharmaciesPage({ searchParams }: Props) {
  return (
    <OwnedPharmaciesPageContent
      initialState={parseOwnedPharmaciesListSearchParams(await searchParams)}
    />
  );
}
