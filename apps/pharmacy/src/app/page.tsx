import { redirect } from 'next/navigation';

import { getPharmacyDashboardPath } from '@/lib/pharmacy/routes';

//===================================================================

function PharmacyRootPage() {
  redirect(getPharmacyDashboardPath());
}

export default PharmacyRootPage;
