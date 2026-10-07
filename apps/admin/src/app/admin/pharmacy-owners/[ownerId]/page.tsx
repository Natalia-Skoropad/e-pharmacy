import { notFound } from 'next/navigation';

import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';

import {
  parseAdminPharmacyOwnerDetailSearchParams,
  parseAdminPharmacyOwnerPharmaciesSearchParams,
  parseAdminPharmacyOwnersListSegments,
  resolveAdminPharmacyOwnersRoute,
} from '@/lib/pharmacy-owners/admin-pharmacy-owner-url';

import { AdminPermissionGate } from '@/components/auth/AdminPermissionGate';
import { PharmacyOwnerDetailsPageContent } from '@/components/pharmacy-owners/PharmacyOwnerDetailsPageContent';
import { PharmacyOwnersPageContent } from '@/components/pharmacy-owners/PharmacyOwnersPageContent/PharmacyOwnersPageContent';

//===================================================================

type AdminPharmacyOwnerDetailsPageProps = Readonly<{
  params: Promise<{ ownerId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

//===================================================================

export default async function AdminPharmacyOwnerDetailsPage({
  params,
  searchParams,
}: AdminPharmacyOwnerDetailsPageProps) {
  const [{ ownerId }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);

  const route = resolveAdminPharmacyOwnersRoute([ownerId]);

  if (route.kind === 'invalid') {
    notFound();
  }

  if (route.kind === 'filters') {
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

  const initialState =
    parseAdminPharmacyOwnerDetailSearchParams(resolvedSearchParams);

  const initialPharmaciesState =
    parseAdminPharmacyOwnerPharmaciesSearchParams(resolvedSearchParams);

  return (
    <AdminPermissionGate permission={ADMIN_PERMISSIONS.pharmacyOwners.view}>
      <PharmacyOwnerDetailsPageContent
        ownerId={route.ownerId}
        initialState={initialState}
        initialPharmaciesState={initialPharmaciesState}
      />
    </AdminPermissionGate>
  );
}
