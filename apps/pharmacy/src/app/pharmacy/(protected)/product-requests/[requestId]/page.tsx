import type { Metadata } from 'next';

import { PharmacyPage } from '@/components/pharmacy/PharmacyPage';
import { PlaceholderCards } from '@/components/pharmacy/PlaceholderCards';

//===================================================================

export const metadata: Metadata = {
  title: 'Product request details',
  description: 'View product request status and moderation details.',
};

//===================================================================

type ProductRequestDetailsPageProps = Readonly<{
  params: Promise<{ requestId: string }>;
}>;

//===================================================================

async function ProductRequestDetailsPage({ params }: ProductRequestDetailsPageProps) {
  const { requestId } = await params;

  return (
    <PharmacyPage
      title={`Product request ${requestId}`}
      description="Readonly/request action skeleton for draft, moderation, approved, and rejected request states."
    >
      <PlaceholderCards
        items={[
          'Request overview',
          'Pharmacy comment',
          'Moderation dates',
          'Admin comment',
          'Rejection reason',
          'Approved product link',
          'Request actions',
        ]}
      />
    </PharmacyPage>
  );
}

export default ProductRequestDetailsPage;
