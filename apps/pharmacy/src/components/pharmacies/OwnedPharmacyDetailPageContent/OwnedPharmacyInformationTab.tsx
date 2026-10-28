'use client';

import { PHARMACY_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import type { OwnedPharmacyDetailResponse } from '@e-pharmacy/types/pharmacies';

import { StatusBadge } from '@e-pharmacy/ui/statistics';

import { show, DateValue, Field, Photo, Contact } from './detail-fields';
import { OwnedPharmacySalesChart } from './OwnedPharmacySalesChart';

import css from './OwnedPharmacyDetailPageContent.module.css';

//===================================================================

export function Information({
  detail,
}: {
  detail: OwnedPharmacyDetailResponse;
}) {
  const { pharmacy, dates } = detail;

  return (
    <div className={css.infoStack}>
      <div className={css.identityGrid}>
        <section
          className={css.photoCard}
          aria-label="Published pharmacy photo"
        >
          <Photo url={pharmacy.imageUrl} name={pharmacy.name || 'Pharmacy'} />
        </section>

        <section
          className={css.sectionCard}
          aria-label="Published pharmacy details"
        >
          <dl className={css.details}>
            <Field label="Pharmacy status">
              <StatusBadge {...PHARMACY_STATUS_PRESENTATION[pharmacy.status]} />
            </Field>

            {pharmacy.status === 'blocked' && pharmacy.statusReason ? (
              <Field label="Status reason">{show(pharmacy.statusReason)}</Field>
            ) : null}

            <Field label="Pharmacy ID">{pharmacy.id}</Field>

            <Field label="Phone">
              <Contact value={pharmacy.phone} type="phone" />
            </Field>

            <Field label="Email">
              <Contact value={pharmacy.email} type="email" />
            </Field>

            <Field label="Country code">
              {show(pharmacy.location?.countryCode)}
            </Field>

            <Field label="Region">{show(pharmacy.location?.region)}</Field>

            <Field label="Settlement">
              {show(pharmacy.location?.settlement)}
            </Field>

            <Field label="Pharmacy address">
              {show(pharmacy.location?.address)}
            </Field>

            <Field label="Created at">
              <DateValue value={dates.createdAt} />
            </Field>

            <Field label="Last edited">
              <DateValue value={dates.updatedAt} />
            </Field>
          </dl>
        </section>
      </div>

      <OwnedPharmacySalesChart pharmacyId={pharmacy.id} />
    </div>
  );
}
