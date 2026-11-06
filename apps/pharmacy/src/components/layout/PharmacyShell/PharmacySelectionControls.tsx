'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { Container } from '@e-pharmacy/ui/layout';
import { PageLoader } from '@e-pharmacy/ui/status-pages';
import { StatusBanner } from '@e-pharmacy/ui/statistics';

import { PHARMACY_ROUTES } from '@/lib/routes';

import {
  getPharmacyIdFromDetailPath,
  isLegacyOperationalPharmacyPath,
} from '@/lib/pharmacies/selected-pharmacy-scope';

import { usePharmacySelection } from '@/providers/PharmacySelectionProvider';

import css from './PharmacySelectionControls.module.css';

//===================================================================

export function PharmacySelectionControls() {
  const pathname = usePathname();

  const { selectedId, memberships, options, isLoading, isOperational, select } =
    usePharmacySelection();

  if (
    !isOperational ||
    getPharmacyIdFromDetailPath(pathname) ||
    isLoading ||
    memberships.length === 0
  ) {
    return null;
  }

  return (
    <div className={css.selector}>
      <label className={css.label} htmlFor="current-pharmacy-select">
        Current pharmacy
      </label>

      <select
        id="current-pharmacy-select"
        className={css.select}
        value={selectedId ?? ''}
        onChange={(event) => select(event.target.value)}
      >
        {memberships.length > 1 ? (
          <option value="">Select a pharmacy</option>
        ) : null}

        {memberships.map((membership) => {
          const option = options.find(
            (item) => item.id.toLowerCase() === membership.id.toLowerCase()
          );

          return (
            <option key={membership.id} value={membership.id.toLowerCase()}>
              {option?.name ?? `Pharmacy #${membership.id.slice(-6)}`}
            </option>
          );
        })}
      </select>
    </div>
  );
}

//===================================================================

/** Do not mount legacy operational pages without an authorized selection. */
export function PharmacyOperationalScope({
  children,
}: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();

  const { selectedId, isLoading, isInvalid, memberships } =
    usePharmacySelection();

  if (!isLegacyOperationalPharmacyPath(pathname)) return children;
  if (isLoading) return <PageLoader label="Loading pharmacy selection..." />;

  if (isInvalid) {
    return (
      <Container>
        <StatusBanner
          tone="warning"
          title="Pharmacy access unavailable"
          message="The requested pharmacy is not part of this account, or your memberships could not be verified."
        />
      </Container>
    );
  }

  if (!selectedId) {
    return (
      <Container>
        <StatusBanner
          tone="info"
          title={memberships.length ? 'Select a pharmacy' : 'No pharmacies yet'}
          message={
            memberships.length
              ? 'Choose the pharmacy above to open its orders, clients and products.'
              : 'Create a pharmacy draft to begin managing its operations.'
          }
          meta={<Link href={PHARMACY_ROUTES.PHARMACIES}>Open pharmacies</Link>}
        />
      </Container>
    );
  }

  return <div key={selectedId}>{children}</div>;
}
