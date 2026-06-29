import type { Metadata } from 'next';

import { PharmacyDashboardPageContent } from '@/components/dashboard/PharmacyDashboardPageContent';

//===================================================================

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Pharmacy dashboard overview.',
};

//===================================================================

function DashboardPage() {
  return <PharmacyDashboardPageContent />;
}

export default DashboardPage;
