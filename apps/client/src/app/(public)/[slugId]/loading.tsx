'use client';

import { useParams } from 'next/navigation';
import { parsePublicEntitySlugId } from '@e-pharmacy/validation/url';

import { PharmacyDetailsLoading, type PharmacyLoadingTab } from '@/components/pharmacies/PharmacyDetailsPageContent/PharmacyDetailsLoading';
import { ProductDetailsLoading } from '@/components/product-catalog/ProductDetailsPageContent/ProductDetailsLoading';
import { getProductTabFromSegment } from '@/lib/routes/product-detail-tabs';

export default function PublicEntityDetailsLoading() {
  const params = useParams<{ slugId: string; tab: string }>();
  const slugId = params?.slugId;
  const entityType = slugId ? parsePublicEntitySlugId(slugId)?.entityType : null;

  if (entityType === 'product') {
    return <ProductDetailsLoading tab={getProductTabFromSegment(params?.tab ?? '') ?? 'details'} />;
  }

  if (entityType !== 'pharmacy') return null;

  const tab: PharmacyLoadingTab =
    params.tab === 'bank-details' ? 'payment' :
    params.tab === 'about' ? 'about' :
    params.tab === 'reviews' ? 'reviews' : 'details';

  return <PharmacyDetailsLoading tab={tab} />;
}
