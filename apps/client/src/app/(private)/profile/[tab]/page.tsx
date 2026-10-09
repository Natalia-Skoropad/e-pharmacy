import { notFound } from 'next/navigation';

import { ProfilePageContent } from '@/components/profile';

//===================================================================

export { metadata } from '../page';

//===================================================================

const TABS = [
  'orders',
  'favorite-products',
  'favorite-pharmacies',
  'sessions',
] as const;

//===================================================================

type Props = Readonly<{ params: Promise<{ tab: string }> }>;

//===================================================================

export default async function ClientProfileTabPage({ params }: Props) {
  const { tab } = await params;
  if (!(TABS as readonly string[]).includes(tab)) notFound();
  return <ProfilePageContent />;
}
