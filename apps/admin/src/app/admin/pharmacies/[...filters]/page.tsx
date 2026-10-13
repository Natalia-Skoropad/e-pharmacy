import { notFound, redirect } from 'next/navigation';

import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';

import {
  buildAdminActivityUrl,
  parseAdminActivityUrl,
} from '@/lib/audit/admin-activity-url';

import { ADMIN_ROUTES } from '@/lib/routes';

import {
  buildAdminPharmaciesListUrl,
  buildAdminPharmacyDetailUrl,
  parseAdminPharmaciesListSegments,
  resolveAdminPharmaciesRoute,
} from '@/lib/pharmacies/admin-pharmacy-url';

import { AdminPermissionGate } from '@/components/auth/AdminPermissionGate';
import { PharmaciesPageContent } from '@/components/pharmacies/PharmaciesPageContent/PharmaciesPageContent';
import { PharmacyDetailsPageContent } from '@/components/pharmacies/PharmacyDetailsPageContent/PharmacyDetailsPageContent';

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

  if (route.kind === 'invalid') return notFound();

  if (route.kind === 'detail') {
    const initialActivityState = {
      ...parseAdminActivityUrl(route.activitySegments),
      ownerUserId: '', // Pharmacy audit must not inherit an owner-wide filter.
    };

    const canonicalUrl =
      buildAdminPharmacyDetailUrl(route.pharmacyId, route.tab) +
      (route.tab === 'activity'
        ? buildAdminActivityUrl(initialActivityState).slice(
            ADMIN_ROUTES.SETTINGS_ACTIVITY.length
          )
        : '');

    const requestedPath = `/admin/pharmacies/${filters.join('/')}`;
    if (canonicalUrl !== requestedPath) redirect(canonicalUrl);

    return (
      <AdminPermissionGate permission={ADMIN_PERMISSIONS.pharmacies.view}>
        <PharmacyDetailsPageContent
          pharmacyId={route.pharmacyId}
          activeTab={route.tab}
          initialActivityState={initialActivityState}
        />
      </AdminPermissionGate>
    );
  }

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
