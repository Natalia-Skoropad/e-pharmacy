import type { Metadata } from 'next';
import Link from 'next/link';

import { getProductRequestsBreadcrumbs } from '@/lib/pharmacy/breadcrumbs';

import {
  getPharmacyNewRequestPath,
  parsePharmacyRequestFilters,
} from '@/lib/pharmacy/routes';

import { CabinetPage } from '@e-pharmacy/ui/common';
import { PlaceholderCards } from '@e-pharmacy/ui/common';

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
    <CabinetPage
      title="Product requests"
      description="Product request table skeleton prepared for future backend API integration."
      breadcrumbs={getProductRequestsBreadcrumbs()}
    >
      <Link href={getPharmacyNewRequestPath()}>Create request</Link>
      <pre>{JSON.stringify(parsedFilters, null, 2)}</pre>
      <PlaceholderCards
        items={['Created date', 'Article', 'Name', 'Category', 'Status']}
      />
    </CabinetPage>
  );
}

export default ProductRequestsPage;
