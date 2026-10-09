import { notFound } from 'next/navigation';

import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';

import {
  parseAdminPharmacyOwnersListSegments,
  parseAdminPharmacyOwnerPharmaciesSearchParams,
  ADMIN_PHARMACY_OWNER_DETAIL_TABS,
  resolveAdminPharmacyOwnersRoute,
} from '@/lib/pharmacy-owners/admin-pharmacy-owner-url';

import { AdminPermissionGate } from '@/components/auth/AdminPermissionGate';
import { PharmacyOwnerDetailsPageContent } from '@/components/pharmacy-owners/PharmacyOwnerDetailsPageContent';
import { PharmacyOwnersPageContent } from '@/components/pharmacy-owners/PharmacyOwnersPageContent/PharmacyOwnersPageContent';

//===================================================================

type AdminPharmacyOwnersFilteredPageProps = Readonly<{
  params: Promise<{ ownerId: string; filters: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

//===================================================================

export default async function AdminPharmacyOwnersFilteredPage({
  params,
  searchParams,
}: AdminPharmacyOwnersFilteredPageProps) {
  const [{ ownerId, filters }, query] = await Promise.all([
    params,
    searchParams,
  ]);

  if (
    /^[a-f0-9]{24}$/i.test(ownerId) &&
    filters.length === 1 &&
    (ADMIN_PHARMACY_OWNER_DETAIL_TABS as readonly string[]).includes(filters[0])
  ) {
    return (
      <AdminPermissionGate permission={ADMIN_PERMISSIONS.pharmacyOwners.view}>
        <PharmacyOwnerDetailsPageContent
          ownerId={ownerId}
          initialState={{
            tab: filters[0] as (typeof ADMIN_PHARMACY_OWNER_DETAIL_TABS)[number],
          }}
          initialPharmaciesState={parseAdminPharmacyOwnerPharmaciesSearchParams(
            query
          )}
        />
      </AdminPermissionGate>
    );
  }
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
