import type { Metadata } from 'next';

import { PharmacyPage } from '@/components/pharmacy/PharmacyPage';
import { PlaceholderCards } from '@/components/pharmacy/PlaceholderCards';
import { parsePharmacyAllProductFilters } from '@/lib/pharmacy/routes';

//===================================================================

export const metadata: Metadata = {
  title: 'All products',
  description: 'View global Admin products available for pharmacy offers.',
};

//===================================================================

type AllProductsPageProps = Readonly<{
  params: Promise<{ filters?: string[] }>;
}>;

//===================================================================

async function AllProductsPage({ params }: AllProductsPageProps) {
  const { filters } = await params;
  const parsedFilters = parsePharmacyAllProductFilters(filters);

  return (
    <PharmacyPage
      title="All products"
      description="Global products table skeleton with add-to-my-pharmacy actions. Products with new status must stay hidden."
    >
      <pre>{JSON.stringify(parsedFilters, null, 2)}</pre>
      <PlaceholderCards
        items={[
          'Created date in Admin',
          'Article',
          'Name',
          'Category',
          'Status',
          'Added to my pharmacy',
          'Action',
        ]}
      />
    </PharmacyPage>
  );
}

export default AllProductsPage;
