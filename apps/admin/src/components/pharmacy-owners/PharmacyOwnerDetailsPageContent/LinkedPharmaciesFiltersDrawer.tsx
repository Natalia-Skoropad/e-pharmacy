import { Star, MapPin, Map, MapPinned, Search } from 'lucide-react';

import { PHARMACY_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import { StatusBadge } from '@e-pharmacy/ui/statistics';

import {
  DateFilter,
  SelectField,
  type SelectOption,
} from '@e-pharmacy/ui/forms';

import { FilterDrawer, InfoTooltip } from '@e-pharmacy/ui/overlays';

import {
  ADMIN_OWNER_PHARMACY_STATUSES,
  type AdminOwnerPharmacyStatus,
  type AdminOwnerRatingFilter,
} from '@/lib/pharmacy-owners/admin-pharmacy-owner';

import type { AdminPharmacyOwnerPharmaciesUrlState } from '@/lib/pharmacy-owners/admin-pharmacy-owner-url';

import css from '../../pharmacies/PharmaciesFiltersDrawer/PharmaciesFiltersDrawer.module.css';

//===================================================================

type LinkedPharmaciesFiltersDrawerProps = Readonly<{
  state: AdminPharmacyOwnerPharmaciesUrlState;
  hasActiveFilters: boolean;

  locationOptions: Readonly<{
    settlements: readonly string[];
    regions: readonly string[];
  }>;

  onChange: (state: AdminPharmacyOwnerPharmaciesUrlState) => void;
  onReset: () => void;
  onClose: () => void;
}>;

//===================================================================

const PHARMACY_STATUS_OPTIONS: Array<
  SelectOption<AdminOwnerPharmacyStatus | 'all'>
> = [
  { value: 'all', label: 'All statuses' },

  ...ADMIN_OWNER_PHARMACY_STATUSES.map((status) => ({
    value: status,
    label: PHARMACY_STATUS_PRESENTATION[status].label,
    content: <StatusBadge {...PHARMACY_STATUS_PRESENTATION[status]} />,
  })),
];

//===================================================================

const PHARMACY_RATING_OPTIONS: Array<
  SelectOption<AdminOwnerRatingFilter | 'all'>
> = [
  { value: 'all', label: 'All ratings' },
  {
    value: '0-0.9',
    label: '0-0.9',

    content: (
      <span className={css.ratingOption}>
        <span className={css.ratingIcon} aria-hidden="true">
          <Star size={15} fill="currentColor" />
        </span>
        <span>0-0.9</span>
      </span>
    ),
  },
  {
    value: '1-1.9',
    label: '1-1.9',

    content: (
      <span className={css.ratingOption}>
        <span className={css.ratingIcon} aria-hidden="true">
          <Star size={15} fill="currentColor" />
        </span>
        <span>1-1.9</span>
      </span>
    ),
  },
  {
    value: '2-2.9',
    label: '2-2.9',

    content: (
      <span className={css.ratingOption}>
        <span className={css.ratingIcon} aria-hidden="true">
          <Star size={15} fill="currentColor" />
        </span>
        <span>2-2.9</span>
      </span>
    ),
  },
  {
    value: '3-3.9',
    label: '3-3.9',

    content: (
      <span className={css.ratingOption}>
        <span className={css.ratingIcon} aria-hidden="true">
          <Star size={15} fill="currentColor" />
        </span>
        <span>3-3.9</span>
      </span>
    ),
  },
  {
    value: '4-5',
    label: '4-5',

    content: (
      <span className={css.ratingOption}>
        <span className={css.ratingIcon} aria-hidden="true">
          <Star size={15} fill="currentColor" />
        </span>
        <span>4-5</span>
      </span>
    ),
  },
];

//===================================================================

export function LinkedPharmaciesFiltersDrawer({
  state,
  locationOptions,
  hasActiveFilters,
  onChange,
  onReset,
  onClose,
}: LinkedPharmaciesFiltersDrawerProps) {
  return (
    <FilterDrawer
      id="owner-linked-pharmacies-filters-panel"
      eyebrow="Linked pharmacies"
      hasActiveFilters={hasActiveFilters}
      onClose={onClose}
      onReset={() => {
        onReset();
        onClose();
      }}
    >
      <DateFilter
        id="owner-linked-pharmacies-created-date-filter"
        label="Created date"
        value={{ from: state.createdFrom, to: state.createdTo }}
        isActive={Boolean(state.createdFrom || state.createdTo)}
        applyOnSubmit
        applyLabel="Apply"
        onChange={({ from, to }) =>
          onChange({
            ...state,
            createdFrom: from,
            createdTo: to,
            page: 1,
          })
        }
      />

      <SelectField
        id="owner-linked-pharmacies-status-filter"
        label="Pharmacy status"
        value={state.status}
        options={PHARMACY_STATUS_OPTIONS}
        isActive={state.status !== 'all'}
        onChange={(status) => onChange({ ...state, status, page: 1 })}
      />

      <div className={css.regionFilter}>
        <span className={css.regionHelp}>
          <InfoTooltip
            label="How location filters work"
            title="Choose a region first"
            icon={<MapPinned size={19} />}
            escapeOverflow
            items={[
              {
                title: 'Select a region',
                description:
                  'Choose a region to enable the Settlement filter. Only settlements in that region will be available.',
                icon: <Map size={17} />,
              },
              {
                title: 'Narrow the results',
                description:
                  'Then select a settlement, or leave All settlements to view the entire region.',
                icon: <Search size={17} />,
              },
            ]}
          />
        </span>

        <SelectField
          id="owner-linked-pharmacies-region-filter"
          label="Region"
          value={state.region}
          options={[
            { value: '', label: 'All regions' },
            ...locationOptions.regions.map((value) => ({
              value,
              label: value,
              content: (
                <span className={css.locationOption}>
                  <span className={css.locationIcon}>
                    <Map size={16} />
                  </span>
                  {value}
                </span>
              ),
            })),
          ]}
          isActive={Boolean(state.region)}
          onChange={(region) =>
            onChange({ ...state, region, settlement: '', page: 1 })
          }
        />
      </div>

      <SelectField
        id="owner-linked-pharmacies-settlement-filter"
        label="Settlement"
        value={state.region ? state.settlement : ''}
        disabled={!state.region}
        options={[
          { value: '', label: 'All settlements' },
          ...locationOptions.settlements.map((value) => ({
            value,
            label: value,
            content: (
              <span className={css.locationOption}>
                <span className={css.locationIcon}>
                  <MapPin size={16} />
                </span>
                {value}
              </span>
            ),
          })),
        ]}
        isActive={Boolean(state.settlement)}
        onChange={(settlement) => onChange({ ...state, settlement, page: 1 })}
      />

      <SelectField
        id="owner-linked-pharmacies-rating-filter"
        label="Pharmacy rating"
        value={state.rating}
        options={PHARMACY_RATING_OPTIONS}
        isActive={state.rating !== 'all'}
        onChange={(rating) => onChange({ ...state, rating, page: 1 })}
      />
    </FilterDrawer>
  );
}

export default LinkedPharmaciesFiltersDrawer;
