import { USER_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';

import {
  DateFilter,
  SelectField,
  type SelectOption,
} from '@e-pharmacy/ui/forms';

import { FilterDrawer } from '@e-pharmacy/ui/overlays';

import {
  ADMIN_PHARMACY_OWNER_STATUSES,
  type AdminPharmacyOwnerStatus,
} from '@/lib/pharmacy-owners/admin-pharmacy-owner';

import type { AdminPharmacyOwnersListUrlState } from '@/lib/pharmacy-owners/admin-pharmacy-owner-url';

//===================================================================

type PharmacyOwnersFiltersDrawerProps = Readonly<{
  state: AdminPharmacyOwnersListUrlState;
  hasActiveFilters: boolean;
  minDate?: string;
  onChange: (state: AdminPharmacyOwnersListUrlState) => void;
  onReset: () => void;
  onClose: () => void;
}>;

//===================================================================

const OWNER_STATUS_OPTIONS: Array<
  SelectOption<AdminPharmacyOwnerStatus | 'all'>
> = [
  { value: 'all', label: 'All statuses' },
  ...ADMIN_PHARMACY_OWNER_STATUSES.map((status) => ({
    value: status,
    label: USER_STATUS_PRESENTATION[status].label,
  })),
];

//===================================================================

export function PharmacyOwnersFiltersDrawer({
  state,
  hasActiveFilters,
  minDate,
  onChange,
  onReset,
  onClose,
}: PharmacyOwnersFiltersDrawerProps) {
  return (
    <FilterDrawer
      id="pharmacy-owners-filters-panel"
      eyebrow="Pharmacy Owners"
      hasActiveFilters={hasActiveFilters}
      onClose={onClose}
      onReset={() => {
        onReset();
        onClose();
      }}
    >
      <DateFilter
        id="pharmacy-owners-registration-date-filter"
        label="Registration date"
        value={{ from: state.registeredFrom, to: state.registeredTo }}
        isActive={Boolean(state.registeredFrom || state.registeredTo)}
        minDate={minDate}
        disabled={!minDate}
        applyOnSubmit
        applyLabel="Apply"
        onChange={({ from, to }) =>
          onChange({
            ...state,
            registeredFrom: from,
            registeredTo: to,
            page: 1,
          })
        }
      />

      <SelectField
        id="pharmacy-owners-account-status"
        label="Account status"
        value={state.status}
        options={OWNER_STATUS_OPTIONS}
        isActive={state.status !== 'all'}
        onChange={(status) => onChange({ ...state, status, page: 1 })}
      />
    </FilterDrawer>
  );
}

export default PharmacyOwnersFiltersDrawer;
