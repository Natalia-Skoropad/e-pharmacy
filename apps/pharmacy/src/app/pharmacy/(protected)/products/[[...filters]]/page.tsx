import type { Metadata } from 'next';

import { PharmacyPage } from '@/components/pharmacy/PharmacyPage';
import { PlaceholderCards } from '@/components/pharmacy/PlaceholderCards';
import { parsePharmacyProductFilters } from '@/lib/pharmacy/routes';

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
    <PharmacyPage
      title="Own products"
      description="Own products table skeleton with category, status, stock, article, name, and date filters."
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
    </PharmacyPage>
  );
}

export default ProductsPage;
