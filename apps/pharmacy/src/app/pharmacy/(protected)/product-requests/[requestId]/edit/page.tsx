import type { Metadata } from 'next';

import { getEditProductRequestBreadcrumbs } from '@/lib/pharmacy/breadcrumbs';

import { PharmacyPage } from '@/components/pharmacy/PharmacyPage';
import { PlaceholderCards } from '@/components/pharmacy/PlaceholderCards';

//===================================================================

export const metadata: Metadata = {
  title: 'Edit product request',
  description: 'Edit a draft product request.',
};

//===================================================================

type EditProductRequestPageProps = Readonly<{
  params: Promise<{ requestId: string }>;
}>;

//===================================================================

async function EditProductRequestPage({ params }: EditProductRequestPageProps) {
  const { requestId } = await params;

  return (
    <PharmacyPage
      title={`Edit product request ${requestId}`}
      description="Edit product request skeleton. Submitted requests must become readonly in the next implementation step."
      breadcrumbs={getEditProductRequestBreadcrumbs(requestId)}
    >
      <PlaceholderCards
        items={[
          'Editable draft fields',
          'Product image upload',
          'Additional documents',
          'Save draft action',
          'Send for moderation action',
          'Cancel action',
        ]}
      />
    </PharmacyPage>
  );
}

export default EditProductRequestPage;
