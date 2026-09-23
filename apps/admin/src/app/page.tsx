import { redirect } from 'next/navigation';

import { ADMIN_ROUTES } from '@/lib/routes';

//===================================================================

function AdminRootPage() {
  redirect(ADMIN_ROUTES.DASHBOARD);
}

export default AdminRootPage;
