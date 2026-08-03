'use client';

import { Clock, Copy, Mail, MapPin, Phone, ShoppingBag } from 'lucide-react';

import { LinkButton } from '@e-pharmacy/ui/navigation';
import { formatAvailableProductsCount } from '@e-pharmacy/utils/numbers';
import { getWorkingHoursDisplayItems } from '@e-pharmacy/validation/pharmacy';
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

  return (
    <>
      <dl className={css.list}>
        {pharmacy.address ? (
          <div className={css.item}>
            <dt>
              <MapPin size={18} aria-hidden="true" />
              Address
            </dt>

            <dd>{pharmacy.address}</dd>
          </div>
        ) : null}

        {pharmacy.phone ? (
          <div className={css.item}>
            <dt>
              <Phone size={18} aria-hidden="true" />
              Phone
            </dt>

            <dd>
              {phoneHref ? (
                <a href={phoneHref}>{pharmacy.phone}</a>
              ) : (
                pharmacy.phone
              )}
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
              <button
                className={css.copyButton}
                type="button"
                aria-label={`Copy pharmacy email ${pharmacy.email}`}
                onClick={() => void onCopy(pharmacy.email!, 'Pharmacy email')}
              >
                <Copy size={16} aria-hidden="true" />
              </button>
            </dd>
          </div>
        ) : null}

        {workingHours ? (
          <div className={css.item}>
            <dt>
              <Clock size={18} aria-hidden="true" />
              Working hours
            </dt>

            <dd className={css.workingHours}>
              {getWorkingHoursDisplayItems(workingHours)?.map((item) => (
                <span key={item.day}>
                  <strong>{item.label}</strong>: {item.hours}
                </span>
              ))}
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

      <LinkButton className={css.link} href={productsHref}>
        View products from this pharmacy
      </LinkButton>
    </>
  );
}
