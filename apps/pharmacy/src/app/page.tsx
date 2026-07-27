import { redirect } from 'next/navigation';

import { PHARMACY_ROUTES } from '@/lib/routes';

//===================================================================

function PharmacyRootPage() {
  redirect(PHARMACY_ROUTES.DASHBOARD);
}

export default PharmacyRootPage;
