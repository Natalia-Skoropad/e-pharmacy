'use client';

import {
  Clock,
  Mail,
  MapPin,
  Phone,
  ShoppingBag,
  PackageSearch,
} from 'lucide-react';

import { LinkButton } from '@e-pharmacy/ui/navigation';
import { CopyButton } from '@e-pharmacy/ui/primitives';
import { WorkingHours } from '@e-pharmacy/ui/data-display';
import { formatAvailableProductsCount } from '@e-pharmacy/utils/numbers';
import type { PublicPharmacy } from '@e-pharmacy/types/pharmacies';

import { getTelephoneHref } from '@/lib/contact/telephone';

import css from './PharmacyContactPanel.module.css';

//===================================================================

export type PharmacyContactPanelProps = Readonly<{
  pharmacy: PublicPharmacy;
  productsHref: string;
  onCopy: (value: string, label: string) => Promise<boolean>;
}>;

//===================================================================

export function PharmacyContactPanel({
  pharmacy,
  productsHref,
  onCopy,
}: PharmacyContactPanelProps) {
  const workingHours = pharmacy.workingHours?.trim() ?? '';
  const phoneHref = getTelephoneHref(pharmacy.phone);

  const location = [pharmacy.location?.region, pharmacy.location?.address]
    .filter(Boolean)
    .join(', ');

  return (
    <>
      <dl className={css.list}>
        {location ? (
          <div className={css.item}>
            <dt>
              <MapPin size={18} aria-hidden="true" />
              Address
            </dt>

            <dd className={css.emailActions}>
              <span>{location}</span>
              <CopyButton
                label={`Copy pharmacy address ${location}`}
                onClick={() => void onCopy(location, 'Pharmacy address')}
              />
            </dd>
          </div>
        ) : null}

        {pharmacy.phone ? (
          <div className={css.item}>
            <dt>
              <Phone size={18} aria-hidden="true" />
              Phone
            </dt>

            <dd className={css.emailActions}>
              {phoneHref ? (
                <a href={phoneHref}>{pharmacy.phone}</a>
              ) : (
                pharmacy.phone
              )}
              <CopyButton
                label={`Copy pharmacy phone ${pharmacy.phone}`}
                onClick={() => void onCopy(pharmacy.phone!, 'Pharmacy phone')}
              />
            </dd>
          </div>
        ) : null}

        {pharmacy.email ? (
          <div className={css.item}>
            <dt>
              <Mail size={18} aria-hidden="true" />
              Email
            </dt>

            <dd className={css.emailActions}>
              <a href={`mailto:${pharmacy.email}`}>{pharmacy.email}</a>
              <CopyButton
                label={`Copy pharmacy email ${pharmacy.email}`}
                onClick={() => void onCopy(pharmacy.email!, 'Pharmacy email')}
              />
            </dd>
          </div>
        ) : null}

        {workingHours ? (
          <div className={css.item}>
            <dt>
              <Clock size={18} aria-hidden="true" />
              Working hours
            </dt>

            <dd>
              <WorkingHours value={workingHours} />
            </dd>
          </div>
        ) : null}

        <div className={css.item}>
          <dt>
            <ShoppingBag size={18} aria-hidden="true" />
            Products
          </dt>

          <dd>
            {formatAvailableProductsCount(pharmacy.availableProductsCount)}
          </dd>
        </div>
      </dl>

      <div className={css.linkRow}>
        <LinkButton className={css.link} href={productsHref} fullWidth>
          <PackageSearch size={18} aria-hidden="true" /> View products
        </LinkButton>
      </div>
    </>
  );
}
