import { notFound, redirect } from 'next/navigation';

import { PharmacyDashboardPageContent } from '@/components/dashboard/PharmacyDashboardPageContent';

//===================================================================

export const metadata = {
  title: 'Dashboard',
  description: 'Pharmacy dashboard overview.',
};

//===================================================================

export default async function FilteredDashboardPage({
  params,
}: {
  params: Promise<{ pharmacyFilter: string }>;
}) {
  const { pharmacyFilter } = await params;
  const match = /^pharmacy-id-([a-f0-9]{24})$/i.exec(pharmacyFilter);

  if (!match) notFound();

  const pharmacyId = match[1]!.toLowerCase();

  if (pharmacyFilter !== `pharmacy-id-${pharmacyId}`)
    redirect(`/pharmacy/dashboard/pharmacy-id-${pharmacyId}`);

  return (
    <PharmacyDashboardPageContent key={pharmacyId} pharmacyId={pharmacyId} />
  );
}
