import { notFound } from 'next/navigation';

import { PharmacyProfilePageContent } from '@/components/profile';

//===================================================================

export { metadata } from '../page';

//===================================================================

const TABS = [
  'pharmacy-data',
  'about',
  'payment',
  'documents',
  'reviews',
  'comments',
  'sessions',
] as const;

//===================================================================

type Props = Readonly<{ params: Promise<{ tab: string }> }>;

//===================================================================

export default async function PharmacyProfileTabPage({ params }: Props) {
  const { tab } = await params;
  if (!(TABS as readonly string[]).includes(tab)) notFound();
  return <PharmacyProfilePageContent />;
}
