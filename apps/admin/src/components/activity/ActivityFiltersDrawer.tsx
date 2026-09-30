import {
  DateFilter,
  SelectField,
  type SelectOption,
} from '@e-pharmacy/ui/forms';

import { FilterDrawer } from '@e-pharmacy/ui/overlays';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITY_TYPES,
  ADMIN_AUDIT_SECTIONS,
  type AdminAuditAction,
  type AdminAuditEntityType,
  type AdminAuditSection,
} from '@/lib/audit/admin-audit';

import {
  getAdminAuditActionLabel,
  getAdminAuditEntityLabel,
  getAdminAuditSectionLabel,
} from '@/lib/audit/admin-audit-presentation';

//===================================================================

export type ActivityHistoryFilters = Readonly<{
  dateFrom: string;
  dateTo: string;
  action: '' | AdminAuditAction;
  entityType: '' | AdminAuditEntityType;
  section: '' | AdminAuditSection;
  actorUserId: string;
}>;

//===================================================================

export const DEFAULT_ACTIVITY_HISTORY_FILTERS: ActivityHistoryFilters = {
  dateFrom: '',
  dateTo: '',
  action: '',
  entityType: '',
  section: '',
  actorUserId: '',
};

//===================================================================

const ACTION_OPTIONS: Array<SelectOption<ActivityHistoryFilters['action']>> = [
  { value: '', label: 'All actions' },
  ...ADMIN_AUDIT_ACTIONS.map((action) => ({
    value: action,
    label: getAdminAuditActionLabel(action),
  })),
];

const ENTITY_OPTIONS: Array<
  SelectOption<ActivityHistoryFilters['entityType']>
> = [
  { value: '', label: 'All entity types' },
  ...ADMIN_AUDIT_ENTITY_TYPES.map((entityType) => ({
    value: entityType,
    label: getAdminAuditEntityLabel(entityType),
  })),
];

const SECTION_OPTIONS: Array<SelectOption<ActivityHistoryFilters['section']>> =
  [
    { value: '', label: 'All sections' },
    ...ADMIN_AUDIT_SECTIONS.map((section) => ({
      value: section,
      label: getAdminAuditSectionLabel(section),
    })),
  ];

//===================================================================

type ActivityFiltersDrawerProps = Readonly<{
  filters: ActivityHistoryFilters;
  hasActiveFilters: boolean;
  minDate?: string;
  onChange: (filters: ActivityHistoryFilters) => void;
  onClose: () => void;
  onReset: () => void;
}>;

//===================================================================

export function ActivityFiltersDrawer({
  filters,
  hasActiveFilters,
  minDate,
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
        options={ACTION_OPTIONS}
        isActive={Boolean(filters.action)}
        onChange={(action) => onChange({ ...filters, action })}
      />

      <SelectField
        id="admin-audit-entity-filter"
        label="Entity type"
        value={filters.entityType}
        options={ENTITY_OPTIONS}
        isActive={Boolean(filters.entityType)}
        onChange={(entityType) => onChange({ ...filters, entityType })}
      />

      <SelectField
        id="admin-audit-section-filter"
        label="Section"
        value={filters.section}
        options={SECTION_OPTIONS}
        isActive={Boolean(filters.section)}
        onChange={(section) => onChange({ ...filters, section })}
      />
    </FilterDrawer>
  );
}
