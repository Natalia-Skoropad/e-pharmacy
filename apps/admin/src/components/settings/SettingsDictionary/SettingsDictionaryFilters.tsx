import type { CalendarDateString } from '@e-pharmacy/types/primitives';
import { DateFilter } from '@e-pharmacy/ui/forms';
import { isCalendarDateString } from '@e-pharmacy/validation/dates';
import { FilterDrawer } from '@e-pharmacy/ui/overlays';

//===================================================================

export type SettingsDictionaryFiltersValue = Readonly<{
  createdFrom: CalendarDateString | '';
  createdTo: CalendarDateString | '';
}>;

export const EMPTY_SETTINGS_DICTIONARY_FILTERS: SettingsDictionaryFiltersValue =
  {
    createdFrom: '',
    createdTo: '',
  };

//===================================================================

type SettingsDictionaryFiltersProps = Readonly<{
  title: string;
  filters: SettingsDictionaryFiltersValue;
  earliestCreatedAt?: CalendarDateString;
  hasActiveFilters: boolean;
  onChange: (filters: SettingsDictionaryFiltersValue) => void;
  onReset: () => void;
  onClose: () => void;
}>;

//===================================================================

function isFilterCalendarDate(value: string): value is CalendarDateString | '' {
  return value === '' || isCalendarDateString(value);
}

//===================================================================

export function SettingsDictionaryFilters({
  title,
  filters,
  earliestCreatedAt,
  hasActiveFilters,
  onChange,
  onReset,
  onClose,
}: SettingsDictionaryFiltersProps) {
  return (
    <FilterDrawer
      id="settings-dictionary-filters-panel"
      eyebrow={title}
      hasActiveFilters={hasActiveFilters}
      onClose={onClose}
      onReset={() => {
        onReset();
        onClose();
      }}
    >
      <DateFilter
        id="settings-dictionary-created-date-filter"
        label="Created"
        value={{ from: filters.createdFrom, to: filters.createdTo }}
        isActive={Boolean(filters.createdFrom || filters.createdTo)}
        minDate={earliestCreatedAt}
        disabled={!earliestCreatedAt}
        applyOnSubmit
        applyLabel="Apply"
        onChange={(value) => {
          const createdFrom = value.from;
          const createdTo = value.to;

          if (!isFilterCalendarDate(createdFrom)) return;
          if (!isFilterCalendarDate(createdTo)) return;

          onChange({ createdFrom, createdTo });
        }}
      />
    </FilterDrawer>
  );
}
