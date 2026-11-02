import { Building2, Camera, Clock3 } from 'lucide-react';

import type { AdminPharmacyDetail } from '@e-pharmacy/types/admin';

import {
  CommentInput,
  EmailInput,
  NameInput,
  PhoneInput,
} from '@e-pharmacy/ui/forms';

import { PictureCard } from '@e-pharmacy/ui/media';

import {
  ProfileSectionHeader,
  WorkingHoursInput,
} from '@e-pharmacy/ui/profile';

import {
  PHARMACY_NAME_MAX_LENGTH,
  PHARMACY_SHORT_DESCRIPTION_MAX_LENGTH,
  USER_ADDRESS_MAX_LENGTH,
  USER_EMAIL_MAX_LENGTH,
  USER_PHONE_MAX_LENGTH,
  PHARMACY_LOCATION_TEXT_MAX_LENGTH,
} from '@e-pharmacy/validation/pharmacy';

import { PharmacyReviewSummary } from './PharmacyReviewSummary';

import css from './PharmacyDataTab.module.css';

//===================================================================

/** The Admin form always reads published values. Pending proposals belong only
 * in the separate moderation comparison above the form. */
export function PharmacyDataTab({
  detail,
}: Readonly<{ detail: AdminPharmacyDetail }>) {
  const current = detail.current;
  const location = current.location;
  const effective = current;

  const noop = () => undefined;

  return (
    <div className={css.tabContent}>
      <PharmacyReviewSummary detail={detail} section="data" />

      <section className={css.profileBlock} aria-label="Pharmacy photo">
        <ProfileSectionHeader
          title={
            <>
              Pharmacy photo <span className={css.required}>*</span>
            </>
          }
          description="Clients see this photo on your pharmacy page and next to your pharmacy in search results and listings. Only the owner can edit it."
          icon={<Camera size={22} aria-hidden="true" />}
        />

        <div className={css.pictureColumn}>
          <PictureCard
            compactLayout
            name={effective.name || 'Pharmacy'}
            pictureUrl={effective.imageUrl || null}
            disabled
            onChange={noop}
            labels={{
              hint: 'Upload a lightweight JPG, PNG, or WEBP photo up to 450 KB. Clients will see it in the pharmacy profile and search results. It will be saved with your draft.',
            }}
          />
        </div>
      </section>

      <section className={css.profileBlock} aria-label="Pharmacy information">
        <ProfileSectionHeader
          title="Pharmacy information"
          description="Tell clients what your pharmacy is called, how to contact it and where to find it."
          icon={<Building2 size={22} aria-hidden="true" />}
        />

        <div className={css.fieldGroups}>
          <div className={css.fieldGroup}>
            <div className={css.nameFields}>
              <NameInput
                id="admin-pharmacy-name"
                name="name"
                label="Pharmacy name"
                hint="This name appears on your pharmacy page, in search results and in the pharmacy list."
                value={effective.name}
                maxLength={PHARMACY_NAME_MAX_LENGTH}
                autoComplete="off"
                required
                disabled
                onChange={noop}
              />

              <CommentInput
                id="admin-pharmacy-short-description"
                name="shortDescription"
                label="Short description"
                placeholder="Briefly describe your pharmacy"
                hint="Clients see this introduction near your pharmacy name (at least 10 characters)."
                value={effective.shortDescription ?? ''}
                maxLength={PHARMACY_SHORT_DESCRIPTION_MAX_LENGTH}
                required
                disabled
                onChange={noop}
              />
            </div>
          </div>

          <div className={css.fieldGroup}>
            <div className={css.fieldsGrid}>
              <PhoneInput
                id="admin-pharmacy-phone"
                name="phone"
                label="Phone"
                hint="Clients can use this phone number to contact the pharmacy."
                value={effective.phone ?? ''}
                maxLength={USER_PHONE_MAX_LENGTH}
                required
                disabled
                onChange={noop}
              />

              <EmailInput
                id="admin-pharmacy-email"
                name="email"
                label="Email"
                hint="Clients can use this email address to contact the pharmacy."
                value={effective.email ?? ''}
                maxLength={USER_EMAIL_MAX_LENGTH}
                required
                disabled
                onChange={noop}
              />
            </div>
          </div>

          <div className={css.fieldGroup}>
            <div className={css.fieldsGrid}>
              <NameInput
                id="admin-pharmacy-region"
                name="region"
                label="Region"
                hint="Enter at least 2 characters for the region."
                value={location?.region ?? ''}
                maxLength={PHARMACY_LOCATION_TEXT_MAX_LENGTH}
                autoComplete="off"
                required
                disabled
                onChange={noop}
              />

              <NameInput
                id="admin-pharmacy-settlement"
                name="settlement"
                label="Settlement"
                hint="Enter at least 2 characters for the city or town."
                value={location?.settlement ?? ''}
                maxLength={PHARMACY_LOCATION_TEXT_MAX_LENGTH}
                autoComplete="off"
                required
                disabled
                onChange={noop}
              />

              <div className={css.fullWidth}>
                <NameInput
                  id="admin-pharmacy-address"
                  name="address"
                  label="Address"
                  hint="Use at least 10 Latin characters, e.g. 15 Shevchenka Street."
                  value={location?.address ?? ''}
                  maxLength={USER_ADDRESS_MAX_LENGTH}
                  autoComplete="off"
                  required
                  disabled
                  onChange={noop}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={css.profileBlock} aria-label="Working hours">
        <ProfileSectionHeader
          title="Working hours"
          description="Let clients know when your pharmacy is open and when they can visit or collect an order."
          icon={<Clock3 size={22} aria-hidden="true" />}
        />

        <WorkingHoursInput
          id="admin-pharmacy-working-hours"
          value={effective.workingHours ?? ''}
          disabled
          onValueChange={noop}
          required
        />
      </section>
    </div>
  );
}
