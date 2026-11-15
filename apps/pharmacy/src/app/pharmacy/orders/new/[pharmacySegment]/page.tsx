import { notFound } from 'next/navigation';

import { isValidObjectId } from '@e-pharmacy/validation/url';

import { OrderDetailsPageContent } from '@/components/orders/OrderDetailsPageContent';

//===================================================================

export default async function CreatePharmacyOrderForPharmacy({
  params,
}: Readonly<{ params: Promise<{ pharmacySegment: string }> }>) {
  const { pharmacySegment } = await params;
  const match = /^pharmacy-id-([0-9a-f]{24})$/i.exec(pharmacySegment);

  if (!match || !isValidObjectId(match[1]!)) notFound();

  return (
    <OrderDetailsPageContent
      key={match[1]}
      mode="create"
      pharmacyId={match[1]!.toLowerCase()}
    />
  );
}
