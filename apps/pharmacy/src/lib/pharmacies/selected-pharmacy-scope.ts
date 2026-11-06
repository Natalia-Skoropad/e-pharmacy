import {
  buildClientPharmaciesPath,
  parseClientPharmaciesSegments,
} from '../clients/client-pharmacies-path';

//===================================================================

/** Canonical browser selection contract. Server membership is always authoritative. */
const ID = /^[0-9a-f]{24}$/i;

const DETAIL_OPERATION =
  /^\/pharmacy\/pharmacies\/([0-9a-f]{24})\/(orders|clients|products)(?:\/|$)/i;

const LEGACY_OPERATION =
  /^\/pharmacy\/(dashboard|orders|clients|products|all-products|product-requests)(?:\/|$)/;

//===================================================================

/** Clients registry and owner client cards do not require a selected pharmacy. */
export function isOwnerClientsListPath(pathname: string): boolean {
  const base = '/pharmacy/clients';

  if (pathname === base) return true;
  if (!pathname.startsWith(`${base}/`)) return false;

  return pathname
    .slice(base.length + 1)
    .split('/')
    .every((segment) =>
      /^(?:pharmacy-|status-|successful-orders-|date-from-|date-to-|search-name-|client-id-|contact-|email-|phone-|address-).+/.test(
        segment
      )
    );
}

//===================================================================

/** Only known client detail tabs are account-wide; invalid paths remain closed. */
export function isOwnerClientDetailPath(pathname: string): boolean {
  if (
    /^\/pharmacy\/clients\/[0-9a-f]{24}(?:\/(?:pharmacies|orders|products|comments))?\/?$/i.test(
      pathname
    )
  ) {
    return true;
  }

  // Canonical pharmacy filters are still part of the owner-wide client card.
  // Validate the filter grammar instead of treating arbitrary nested paths as
  // selection-free operational routes.
  const match = /^\/pharmacy\/clients\/([0-9a-f]{24})\/pharmacies\/(.+)$/i.exec(
    pathname
  );

  if (!match) return false;

  try {
    const state = parseClientPharmaciesSegments(match[2]!.split('/'));

    return buildClientPharmaciesPath(match[1]!, state) === pathname;
  } catch {
    return false;
  }
}

//===================================================================

let authorizedPharmacyId: string | null = null;

//===================================================================

export function isOperationalPharmacyPath(pathname: string): boolean {
  return (
    (LEGACY_OPERATION.test(pathname) &&
      !isOwnerClientsListPath(pathname) &&
      !isOwnerClientDetailPath(pathname)) ||
    DETAIL_OPERATION.test(pathname)
  );
}

//===================================================================

export function isLegacyOperationalPharmacyPath(pathname: string): boolean {
  return (
    LEGACY_OPERATION.test(pathname) &&
    !isOwnerClientsListPath(pathname) &&
    !isOwnerClientDetailPath(pathname)
  );
}

//===================================================================

export function getPharmacyIdFromDetailPath(pathname: string): string | null {
  return DETAIL_OPERATION.exec(pathname)?.[1]?.toLowerCase() ?? null;
}

//===================================================================

/** A malformed explicit query must not silently fall back to another pharmacy. */
export function readExplicitPharmacySelection(
  pathname: string,
  search: string
): { id: string | null; invalid: boolean } {
  const pathId = getPharmacyIdFromDetailPath(pathname);

  if (pathId) return { id: pathId, invalid: false };

  const query = new URLSearchParams(search);
  const all = query.getAll('pharmacyId');

  if (all.length === 0) return { id: null, invalid: false };

  if (all.length !== 1 || !ID.test(all[0] ?? '')) {
    return { id: null, invalid: true };
  }

  return { id: all[0]!.toLowerCase(), invalid: false };
}

//===================================================================

export function withSelectedPharmacyQuery(
  pathname: string,
  search: string,
  pharmacyId: string
): string {
  if (!ID.test(pharmacyId)) throw new TypeError('Invalid pharmacy ID.');

  const params = new URLSearchParams(search);

  params.set('pharmacyId', pharmacyId.toLowerCase());

  return `${pathname}?${params.toString()}`;
}

//===================================================================

/** Memberships are an allow-list; neither URLs nor storage grant access. */
export function resolveSelectedPharmacyId({
  explicit,
  preferredId,
  memberships,
}: Readonly<{
  explicit: Readonly<{ id: string | null; invalid: boolean }>;
  preferredId: string | null;
  memberships: readonly Readonly<{ id: string }>[];
}>): string | null {
  if (explicit.invalid) return null;

  const allowed = (candidate: string | null) =>
    candidate &&
    memberships.some(
      (membership) => membership.id.toLowerCase() === candidate.toLowerCase()
    )
      ? candidate.toLowerCase()
      : null;

  if (explicit.id) return allowed(explicit.id);
  if (preferredId && allowed(preferredId)) return allowed(preferredId);

  return memberships.length === 1 ? allowed(memberships[0]!.id) : null;
}

//===================================================================

/** Only the authenticated selection provider may update this value. */
export function setAuthorizedPharmacySelection(value: string | null): void {
  authorizedPharmacyId = value && ID.test(value) ? value.toLowerCase() : null;
}

//===================================================================

export function getAuthorizedPharmacySelection(): string | null {
  return authorizedPharmacyId;
}
