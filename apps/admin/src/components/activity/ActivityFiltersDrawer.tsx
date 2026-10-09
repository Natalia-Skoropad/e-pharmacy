import {
  DateFilter,
  SelectField,
  type SelectOption,
} from '@e-pharmacy/ui/forms';

import { FilterDrawer } from '@e-pharmacy/ui/overlays';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ACTOR_TYPES,
  ADMIN_AUDIT_SECTIONS,
  type AdminAuditAction,
  type AdminAuditActorType,
  type AdminAuditSection,
} from '@/lib/audit/admin-audit';

import {
  getAdminAuditActionLabel,
  getAdminAuditSectionLabel,
} from '@/lib/audit/admin-audit-presentation';

//===================================================================

export type ActivityHistoryFilters = Readonly<{
  dateFrom: string;
  dateTo: string;
  action: '' | AdminAuditAction;
  section: '' | AdminAuditSection;
  actorType: '' | AdminAuditActorType;
  employeeUserId: string;
  ownerUserId: string;
}>;

//===================================================================

export const DEFAULT_ACTIVITY_HISTORY_FILTERS: ActivityHistoryFilters = {
  dateFrom: '',
  dateTo: '',
  action: '',
  section: '',
  actorType: '',
  employeeUserId: '',
  ownerUserId: '',
};

//===================================================================

const ACTION_OPTIONS: Array<SelectOption<ActivityHistoryFilters['action']>> = [
  { value: '', label: 'All actions' },
  ...ADMIN_AUDIT_ACTIONS.map((action) => ({
    value: action,
    label: getAdminAuditActionLabel(action),
  })),
];

const SECTION_OPTIONS: Array<SelectOption<ActivityHistoryFilters['section']>> =
  [
    { value: '', label: 'All sections' },
    ...ADMIN_AUDIT_SECTIONS.filter((section) => section !== 'profile').map(
      (section) => ({
        value: section,
        label: getAdminAuditSectionLabel(section),
      })
    ),
  ];

//===================================================================

const ACTOR_TYPE_LABELS: Readonly<Record<AdminAuditActorType, string>> = {
  employee: 'Employee',
  pharmacyOwner: 'Pharmacy owner',
  pharmacyEmployee: 'Pharmacy employee',
};

const ACTOR_TYPE_OPTIONS: Array<
  SelectOption<ActivityHistoryFilters['actorType']>
> = [
  { value: '', label: 'All' },
  ...ADMIN_AUDIT_ACTOR_TYPES.map((actorType) => ({
    value: actorType,
    label: ACTOR_TYPE_LABELS[actorType],
  })),
];

//===================================================================

type ActivityFiltersDrawerProps = Readonly<{
  filters: ActivityHistoryFilters;
  hasActiveFilters: boolean;
  minDate?: string;
  availableActions?: readonly AdminAuditAction[];
  availableSections?: readonly AdminAuditSection[];
  onChange: (filters: ActivityHistoryFilters) => void;
  onClose: () => void;
  onReset: () => void;
}>;

//===================================================================

export function ActivityFiltersDrawer({
  filters,
  hasActiveFilters,
  minDate,
  availableActions,
  availableSections,
  onChange,
  onClose,
  onReset,
}: ActivityFiltersDrawerProps) {
  return (
    <FilterDrawer
      id="activity-history-filters-panel"
      eyebrow="Activity history"
      hasActiveFilters={hasActiveFilters}
      onClose={onClose}
      onReset={() => {
        onReset();
        onClose();
      }}
    >
      <DateFilter
        id="admin-audit-date-filter"
        label="Date"
        value={{ from: filters.dateFrom, to: filters.dateTo }}
        isActive={Boolean(filters.dateFrom || filters.dateTo)}
        minDate={minDate}
        disabled={!minDate}
        applyOnSubmit
        applyLabel="Apply"
        onChange={(value) =>
          onChange({
            ...filters,
            dateFrom: value.from,
            dateTo: value.to,
          })
        }
      />

      <SelectField
        id="admin-audit-action-filter"
        label="Change type"
        value={filters.action}
        options={
          availableActions
            ? ACTION_OPTIONS.filter(
                (option) =>
                  !option.value || availableActions.includes(option.value)
              )
            : ACTION_OPTIONS
        }
        isActive={Boolean(filters.action)}
        onChange={(action) => onChange({ ...filters, action })}
      />

      <SelectField
        id="admin-audit-actor-type-filter"
        label="Changed by"
        value={filters.actorType}
        options={ACTOR_TYPE_OPTIONS}
        isActive={Boolean(filters.actorType)}
        onChange={(actorType) =>
          onChange({
            ...filters,
            actorType,
            ...(actorType !== 'pharmacyOwner' ? { ownerUserId: '' } : {}),
            ...(actorType !== 'employee' ? { employeeUserId: '' } : {}),
          })
        }
      />

      <SelectField
        id="admin-audit-section-filter"
        label="Section name"
        value={filters.section}
        options={
          availableSections
            ? [
                { value: '', label: 'All sections' },
                ...availableSections.map((section) => ({
                  value: section,
                  label: getAdminAuditSectionLabel(section),
                })),
              ]
            : SECTION_OPTIONS
        }
        isActive={Boolean(filters.section)}
        onChange={(section) => onChange({ ...filters, section })}
      />
    </FilterDrawer>
  );
}
