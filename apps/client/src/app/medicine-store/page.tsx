import { redirect } from 'next/navigation';

import { ROUTES } from '@/lib/constants/routes';

//===================================================================

function MedicineStoreLegacyPage() {
  redirect(ROUTES.MEDICINES_CATALOG);
}

export default MedicineStoreLegacyPage;
