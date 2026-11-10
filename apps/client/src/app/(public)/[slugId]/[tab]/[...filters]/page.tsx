import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { parseProductOffersSegments } from '@/lib/catalog/product-offers-paths';

import PublicDetailTabPage, {
  generateMetadata as generateTabMetadata,
} from '../page';

//===================================================================

type Props = Readonly<{
  params: Promise<{ slugId: string; tab: string; filters: string[] }>;
  searchParams?: Promise<{ pharmacyId?: string }>;
}>;

//===================================================================

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slugId, tab, filters } = await params;

  if (tab !== 'pharmacies' || !parseProductOffersSegments(filters)) return {};

  return generateTabMetadata({ params: Promise.resolve({ slugId, tab }) });
}

//===================================================================

export default async function PublicProductOffersFilteredPage({
  params,
  searchParams,
}: Props) {
  const { slugId, tab, filters } = await params;

  if (tab !== 'pharmacies' || !parseProductOffersSegments(filters)) notFound();

  return PublicDetailTabPage({
    params: Promise.resolve({ slugId, tab }),
    searchParams,
  });
}
