import type { Metadata } from 'next';

import { getProductRequestDetailsBreadcrumbs } from '@/lib/pharmacy/breadcrumbs';

import { CabinetPage } from '@e-pharmacy/ui/common';
import { PlaceholderCards } from '@e-pharmacy/ui/common';

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

async function ProductRequestDetailsPage({
  params,
}: ProductRequestDetailsPageProps) {
  const { requestId } = await params;

  return (
    <CabinetPage
      title={`Product request ${requestId}`}
      description="Readonly/request action skeleton for draft, moderation, approved, and rejected request states."
      breadcrumbs={getProductRequestDetailsBreadcrumbs(requestId)}
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
    </CabinetPage>
  );
}

export default ProductRequestDetailsPage;
