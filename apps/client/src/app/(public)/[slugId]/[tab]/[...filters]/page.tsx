import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { parseProductOffersSegments } from '@/lib/catalog/product-offers-paths';

import {
  createProductDetailMetadata,
  resolveProductBySlugId,
} from '@/lib/details';

import PublicDetailTabPage from '../page';

//===================================================================

type Props = Readonly<{
  params: Promise<{ slugId: string; tab: string; filters: string[] }>;
  searchParams?: Promise<{ pharmacyId?: string }>;
}>;

//===================================================================

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slugId, tab, filters } = await params;

  const parsed =
    tab === 'pharmacies' ? parseProductOffersSegments(filters) : null;

  if (!parsed) return {};

  const result = await resolveProductBySlugId(slugId);

  return result.status === 'found'
    ? createProductDetailMetadata(result.product, 'pharmacies', parsed)
    : {};
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
