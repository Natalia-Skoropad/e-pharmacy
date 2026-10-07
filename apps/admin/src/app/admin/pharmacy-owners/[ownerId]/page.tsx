import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';

import {
  parseAdminPharmacyOwnerDetailSearchParams,
  parseAdminPharmacyOwnerPharmaciesSearchParams,
} from '@/lib/pharmacy-owners/admin-pharmacy-owner-url';

import { AdminPermissionGate } from '@/components/auth/AdminPermissionGate';
import { PharmacyOwnerDetailsPageContent } from '@/components/pharmacy-owners/PharmacyOwnerDetailsPageContent';

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

  const initialState =
    parseAdminPharmacyOwnerDetailSearchParams(resolvedSearchParams);

  const initialPharmaciesState =
    parseAdminPharmacyOwnerPharmaciesSearchParams(resolvedSearchParams);

  return (
    <AdminPermissionGate permission={ADMIN_PERMISSIONS.pharmacyOwners.view}>
      <PharmacyOwnerDetailsPageContent
        ownerId={ownerId}
        initialState={initialState}
        initialPharmaciesState={initialPharmaciesState}
      />
    </AdminPermissionGate>
  );
}
