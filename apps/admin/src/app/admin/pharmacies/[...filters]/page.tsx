import { notFound, redirect } from 'next/navigation';

import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';

import {
  buildAdminPharmaciesListUrl,
  parseAdminPharmaciesListSegments,
  resolveAdminPharmaciesRoute,
} from '@/lib/pharmacies/admin-pharmacy-url';

import { AdminPermissionGate } from '@/components/auth/AdminPermissionGate';
import { PharmaciesPageContent } from '@/components/pharmacies/PharmaciesPageContent/PharmaciesPageContent';

//===================================================================

type FilteredPharmaciesPageProps = Readonly<{
  params: Promise<{ filters: string[] }>;
}>;

//===================================================================

export default async function FilteredPharmaciesPage({
  params,
}: FilteredPharmaciesPageProps) {
  const { filters } = await params;
  const route = resolveAdminPharmaciesRoute(filters);

  // Pharmacy detail belongs to later Stage 14 steps. Never mistake its ID
  // for a registry filter, nor render an incomplete or empty detail page.
  if (route.kind !== 'list') return notFound();

  const initialState = parseAdminPharmaciesListSegments(route.filters);
  const canonicalUrl = buildAdminPharmaciesListUrl(initialState);
  const requestedPath = `/admin/pharmacies/${filters.join('/')}`;

  if (requestedPath !== canonicalUrl) redirect(canonicalUrl);

  return (
    <AdminPermissionGate permission={ADMIN_PERMISSIONS.pharmacies.view}>
      <PharmaciesPageContent initialState={initialState} />
    </AdminPermissionGate>
  );
}
