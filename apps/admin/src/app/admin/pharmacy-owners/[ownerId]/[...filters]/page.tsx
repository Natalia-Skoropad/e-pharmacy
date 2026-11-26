import { notFound, redirect } from 'next/navigation';

import { parseAdminActivityUrl } from '@/lib/audit/admin-activity-url';
import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';

import {
  parseAdminPharmacyOwnersListSegments,
  parseAdminPharmacyOwnerPharmaciesSearchParams,
  parseAdminPharmacyOwnerPharmaciesSegments,
  isAdminOwnerPharmaciesFilterSegment,
  buildAdminPharmacyOwnerPharmaciesUrl,
  ADMIN_PHARMACY_OWNER_DETAIL_TABS,
  resolveAdminPharmacyOwnersRoute,
} from '@/lib/pharmacy-owners/admin-pharmacy-owner-url';

import {
  buildSalesChartPath,
  parseSalesChartSegments,
} from '@/lib/pharmacy-owners/owner-sales-chart-paths';

import {
  buildProductRequestsPath,
  isProductRequestsFilterRoute,
  parseProductRequestsSegments,
  parseProductRequestsPaginationSegments,
} from '@/lib/product-requests/admin-product-request-paths';

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

  if (/^[a-f0-9]{24}$/i.test(ownerId) && filters[0] === 'product-requests') {
    const segments = filters.slice(1);

    if (!isProductRequestsFilterRoute(segments)) notFound();

    const canonical = buildProductRequestsPath(
      parseProductRequestsSegments({ filters: segments }),
      parseProductRequestsPaginationSegments({ filters: segments }),
      ownerId
    );

    const incoming = `/admin/pharmacy-owners/${ownerId}/${filters.join('/')}`;

    if (incoming !== canonical) redirect(canonical);

    return (
      <AdminPermissionGate permission={ADMIN_PERMISSIONS.pharmacyOwners.view}>
        <PharmacyOwnerDetailsPageContent
          ownerId={ownerId}
          initialState={{ tab: 'product-requests' }}
          initialPharmaciesState={parseAdminPharmacyOwnerPharmaciesSearchParams(
            query
          )}
        />
      </AdminPermissionGate>
    );
  }

  if (
    /^[a-f0-9]{24}$/i.test(ownerId) &&
    /^(year|month)-/.test(filters[0] ?? '')
  ) {
    const base = `/admin/pharmacy-owners/${ownerId}`;

    let canonical: string;

    try {
      canonical = buildSalesChartPath(base, parseSalesChartSegments(filters));
    } catch {
      notFound();
    }

    if (`${base}/${filters.join('/')}` !== canonical) redirect(canonical);

    return (
      <AdminPermissionGate permission={ADMIN_PERMISSIONS.pharmacyOwners.view}>
        <PharmacyOwnerDetailsPageContent
          ownerId={ownerId}
          initialState={{ tab: 'personal' }}
          initialPharmaciesState={parseAdminPharmacyOwnerPharmaciesSearchParams(
            query
          )}
        />
      </AdminPermissionGate>
    );
  }

  if (/^[a-f0-9]{24}$/i.test(ownerId) && filters[0] === 'pharmacies') {
    const segments = filters.slice(1);

    if (
      segments.some((segment) => !isAdminOwnerPharmaciesFilterSegment(segment))
    )
      notFound();

    const parsed = segments.length
      ? parseAdminPharmacyOwnerPharmaciesSegments(segments)
      : parseAdminPharmacyOwnerPharmaciesSearchParams(query);

    const canonical = buildAdminPharmacyOwnerPharmaciesUrl(ownerId, parsed);
    const incoming = `/admin/pharmacy-owners/${ownerId}/${filters.join('/')}`;

    if (segments.length && canonical !== incoming) redirect(canonical);

    return (
      <AdminPermissionGate permission={ADMIN_PERMISSIONS.pharmacyOwners.view}>
        <PharmacyOwnerDetailsPageContent
          ownerId={ownerId}
          initialState={{ tab: 'pharmacies' }}
          initialPharmaciesState={parsed}
        />
      </AdminPermissionGate>
    );
  }

  if (/^[a-f0-9]{24}$/i.test(ownerId) && filters[0] === 'activity') {
    return (
      <AdminPermissionGate permission={ADMIN_PERMISSIONS.pharmacyOwners.view}>
        <PharmacyOwnerDetailsPageContent
          ownerId={ownerId}
          initialState={{ tab: 'activity' }}
          initialPharmaciesState={parseAdminPharmacyOwnerPharmaciesSearchParams(
            query
          )}
          initialActivityState={parseAdminActivityUrl(filters.slice(1))}
        />
      </AdminPermissionGate>
    );
  }

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
