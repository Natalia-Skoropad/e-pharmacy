import { Star } from 'lucide-react';

import { PHARMACY_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import { getBusinessCalendarDate } from '@e-pharmacy/utils/date';

import {
  DateFilter,
  SelectField,
  type SelectOption,
} from '@e-pharmacy/ui/forms';

import { FilterDrawer } from '@e-pharmacy/ui/overlays';
import { StatusBadge } from '@e-pharmacy/ui/statistics';

import css from './PharmaciesFiltersDrawer.module.css';

import {
  ADMIN_PHARMACY_RATINGS,
  ADMIN_PHARMACY_STATUSES,
  type AdminPharmacyRating,
  type AdminPharmacyStatus,
} from '@/lib/pharmacies/admin-pharmacy';

import type { AdminPharmacyListUrlState } from '@/lib/pharmacies/admin-pharmacy-url';

//===================================================================

type PharmaciesFiltersDrawerProps = Readonly<{
  state: AdminPharmacyListUrlState;
  minDate?: string;
  hasActiveFilters: boolean;
  onChange: (nextState: AdminPharmacyListUrlState) => void;
  onReset: () => void;
  onClose: () => void;
}>;

//===================================================================

const STATUS_OPTIONS: Array<SelectOption<AdminPharmacyStatus | 'all'>> = [
  { value: 'all', label: 'All statuses' },
  ...ADMIN_PHARMACY_STATUSES.map((status) => ({
    value: status,
    label: PHARMACY_STATUS_PRESENTATION[status].label,
    content: <StatusBadge {...PHARMACY_STATUS_PRESENTATION[status]} />,
  })),
];

//===================================================================

const RATING_OPTIONS: Array<SelectOption<AdminPharmacyRating | 'all'>> = [
  { value: 'all', label: 'All ratings' },
  ...ADMIN_PHARMACY_RATINGS.map((rating) => ({
    value: rating,
    label: rating,

    content: (
      <span className={css.ratingOption}>
        <span className={css.ratingIcon} aria-hidden="true">
          <Star size={15} fill="currentColor" />
        </span>
        <span>{rating}</span>
      </span>
    ),
  })),
];

//===================================================================

export function PharmaciesFiltersDrawer({
  state,
  minDate,
  hasActiveFilters,
  onChange,
  onReset,
  onClose,
}: PharmaciesFiltersDrawerProps) {
  return (
    <FilterDrawer
      id="pharmacies-filters-panel"
      eyebrow="Pharmacies"
      hasActiveFilters={hasActiveFilters}
      onClose={onClose}
      onReset={() => {
        onReset();
        onClose();
      }}
    >
      <DateFilter
        id="pharmacies-created-date"
        label="Creation date"
        value={{ from: state.createdFrom, to: state.createdTo }}
        isActive={Boolean(state.createdFrom || state.createdTo)}
        minDate={minDate}
        maxDate={getBusinessCalendarDate() ?? undefined}
        disabled={!minDate}
        applyOnSubmit
        applyLabel="Apply"
        onChange={({ from, to }) =>
          onChange({ ...state, createdFrom: from, createdTo: to, page: 1 })
        }
      />

      <SelectField
        id="pharmacies-filter-status"
        label="Pharmacy status"
        value={state.status}
        options={STATUS_OPTIONS}
        isActive={state.status !== 'all'}
        onChange={(status) => onChange({ ...state, status, page: 1 })}
      />

      <SelectField
        id="pharmacies-filter-rating"
        label="Rating"
        value={state.rating}
        options={RATING_OPTIONS}
        isActive={state.rating !== 'all'}
        onChange={(rating) => onChange({ ...state, rating, page: 1 })}
      />
    </FilterDrawer>
  );
}

export default PharmaciesFiltersDrawer;
