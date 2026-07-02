import { redirect } from 'next/navigation';

import { getPharmacyDashboardPath } from '@/lib/layout/routes';

//===================================================================

function PharmacyRootPage() {
  redirect(getPharmacyDashboardPath());
}

export default PharmacyRootPage;
