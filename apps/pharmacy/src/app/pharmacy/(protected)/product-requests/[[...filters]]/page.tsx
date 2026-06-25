import type { Metadata } from 'next';
import Link from 'next/link';

import { PharmacyPage } from '@/components/pharmacy/PharmacyPage';
import { PlaceholderCards } from '@/components/pharmacy/PlaceholderCards';
import { getPharmacyNewRequestPath, parsePharmacyRequestFilters } from '@/lib/pharmacy/routes';

//===================================================================

export const metadata: Metadata = {
  title: 'Product requests',
  description: 'View pharmacy product creation requests.',
};

//===================================================================

type ProductRequestsPageProps = Readonly<{
  params: Promise<{ filters?: string[] }>;
}>;

//===================================================================

async function ProductRequestsPage({ params }: ProductRequestsPageProps) {
  const { filters } = await params;
  const parsedFilters = parsePharmacyRequestFilters(filters);

  return (
    <PharmacyPage
      title="Product requests"
      description="Product request table skeleton prepared for future backend API integration."
    >
      <Link href={getPharmacyNewRequestPath()}>Create request</Link>
      <pre>{JSON.stringify(parsedFilters, null, 2)}</pre>
      <PlaceholderCards items={['Created date', 'Article', 'Name', 'Category', 'Status']} />
    </PharmacyPage>
  );
}

export default ProductRequestsPage;
