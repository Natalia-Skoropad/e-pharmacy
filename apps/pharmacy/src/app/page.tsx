import { redirect } from 'next/navigation';

import { getPharmacyDashboardPath } from '@e-pharmacy/config/pharmacy';

//===================================================================

function PharmacyRootPage() {
  redirect(getPharmacyDashboardPath());
}

export default PharmacyRootPage;
