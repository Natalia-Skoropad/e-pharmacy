import { notFound } from 'next/navigation';

import { AdminProfilePageContent } from '@/components/profile/AdminProfilePageContent/AdminProfilePageContent';

//===================================================================

const TABS = ['documents', 'comments', 'sessions'] as const;

//===================================================================

type Props = Readonly<{ params: Promise<{ tab: string }> }>;

//===================================================================

export default async function AdminProfileTabPage({ params }: Props) {
  const { tab } = await params;
  if (!(TABS as readonly string[]).includes(tab)) notFound();
  return <AdminProfilePageContent />;
}
