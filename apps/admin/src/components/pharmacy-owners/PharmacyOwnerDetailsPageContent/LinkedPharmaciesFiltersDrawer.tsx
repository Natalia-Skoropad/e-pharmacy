import { PHARMACY_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';

import {
  DateFilter,
  SelectField,
  type SelectOption,
} from '@e-pharmacy/ui/forms';

import { FilterDrawer } from '@e-pharmacy/ui/overlays';

import {
  ADMIN_OWNER_PHARMACY_STATUSES,
  type AdminOwnerPharmacyStatus,
  type AdminOwnerRatingFilter,
} from '@/lib/pharmacy-owners/admin-pharmacy-owner';

import type { AdminPharmacyOwnerPharmaciesUrlState } from '@/lib/pharmacy-owners/admin-pharmacy-owner-url';

//===================================================================

type LinkedPharmaciesFiltersDrawerProps = Readonly<{
  state: AdminPharmacyOwnerPharmaciesUrlState;
  hasActiveFilters: boolean;
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
  })),
];

const PHARMACY_RATING_OPTIONS: Array<
  SelectOption<AdminOwnerRatingFilter | 'all'>
> = [
  { value: 'all', label: 'All ratings' },
  { value: '0-0.9', label: '0 to 0.9' },
  { value: '1-1.9', label: '1 to 1.9' },
  { value: '2-2.9', label: '2 to 2.9' },
  { value: '3-3.9', label: '3 to 3.9' },
  { value: '4-5', label: '4 to 5' },
];

//===================================================================

export function LinkedPharmaciesFiltersDrawer({
  state,
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
