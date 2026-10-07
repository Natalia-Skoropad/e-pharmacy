import { notFound } from 'next/navigation';

import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';

import {
  parseAdminPharmacyOwnersListSegments,
  resolveAdminPharmacyOwnersRoute,
} from '@/lib/pharmacy-owners/admin-pharmacy-owner-url';

import { AdminPermissionGate } from '@/components/auth/AdminPermissionGate';
import { PharmacyOwnersPageContent } from '@/components/pharmacy-owners/PharmacyOwnersPageContent/PharmacyOwnersPageContent';

//===================================================================

type AdminPharmacyOwnersFilteredPageProps = Readonly<{
  params: Promise<{ ownerId: string; filters: string[] }>;
}>;

//===================================================================

export default async function AdminPharmacyOwnersFilteredPage({
  params,
}: AdminPharmacyOwnersFilteredPageProps) {
  const { ownerId, filters } = await params;
  const route = resolveAdminPharmacyOwnersRoute([ownerId, ...filters]);

  if (route.kind !== 'filters') {
    notFound();
  }

  return (
    <AdminPermissionGate permission={ADMIN_PERMISSIONS.pharmacyOwners.view}>
      <PharmacyOwnersPageContent
        initialState={parseAdminPharmacyOwnersListSegments({
          filters: route.filters,
        })}
      />
    </AdminPermissionGate>
  );
}
