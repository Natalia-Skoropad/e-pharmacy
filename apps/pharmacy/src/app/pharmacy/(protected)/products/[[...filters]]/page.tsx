import type { Metadata } from 'next';

import { getProductsBreadcrumbs } from '@/lib/pharmacy/breadcrumbs';
import { parsePharmacyProductFilters } from '@/lib/pharmacy/routes';

import { CabinetPage } from '@e-pharmacy/ui/common';
import { PlaceholderCards } from '@e-pharmacy/ui/common';

//===================================================================

export const metadata: Metadata = {
  title: 'Own products',
  description: 'View products added to the current pharmacy.',
};

//===================================================================

type ProductsPageProps = Readonly<{
  params: Promise<{ filters?: string[] }>;
}>;

//===================================================================

async function ProductsPage({ params }: ProductsPageProps) {
  const { filters } = await params;
  const parsedFilters = parsePharmacyProductFilters(filters);

  return (
    <CabinetPage
      title="Own products"
      description="Own products table skeleton with category, status, stock, article, name, and date filters."
      breadcrumbs={getProductsBreadcrumbs()}
    >
      <pre>{JSON.stringify(parsedFilters, null, 2)}</pre>
      <PlaceholderCards
        items={[
          'Added date',
          'Article',
          'Name',
          'Category',
          'Stock quantity',
          'Reserved quantity',
          'Available quantity',
          'Current price',
          'Status',
        ]}
      />
    </CabinetPage>
  );
}

export default ProductsPage;
