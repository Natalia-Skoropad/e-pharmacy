import {
  Building2,
  BriefcaseBusiness,
  FileText,
  MapPinned,
  Package,
  PackageSearch,
  ShoppingBag,
  Tags,
  UsersRound,
  UserCog,
  Search,
  History,
  Star,
  UserRound,
  Store,
  UserRoundCog,
} from 'lucide-react';

import {
  DateFilter,
  SelectField,
  type SelectOption,
} from '@e-pharmacy/ui/forms';

import { FilterDrawer, InfoTooltip } from '@e-pharmacy/ui/overlays';

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

import css from './ActivityFiltersDrawer.module.css';

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

// Map each recorded action to the same section represented in the Admin sidebar.
function getActionSection(action: AdminAuditAction): AdminAuditSection {
  if (action.startsWith('pharmacyOwner.')) return 'pharmacyOwners';
  if (action.startsWith('pharmacy.')) return 'pharmacies';
  if (action.startsWith('productCategory.')) return 'categories';
  if (action.startsWith('position.')) return 'positions';
  if (action.startsWith('productRequest.')) return 'productRequests';

  return 'employees';
}

//===================================================================

function sectionIcon(section: AdminAuditSection) {
  const size = 16;

  switch (section) {
    case 'pharmacyOwners':
      return <UsersRound size={size} />;
    case 'pharmacies':
      return <Building2 size={size} />;
    case 'products':
      return <Package size={size} />;
    case 'productRequests':
      return <PackageSearch size={size} />;
    case 'orders':
      return <ShoppingBag size={size} />;
    case 'clients':
      return <UsersRound size={size} />;
    case 'productReviews':
    case 'pharmacyReviews':
      return <Star size={size} />;
    case 'employees':
    case 'profile':
      return <UserCog size={size} />;
    case 'positions':
      return <BriefcaseBusiness size={size} />;
    case 'categories':
      return <Tags size={size} />;
    case 'sitePages':
      return <FileText size={size} />;
  }
}

//===================================================================

function withIcon(section: AdminAuditSection, label: string) {
  return (
    <span className={css.option}>
      <span className={css.optionIcon}>{sectionIcon(section)}</span>
      {label}
    </span>
  );
}

//===================================================================

const ACTION_OPTIONS: Array<SelectOption<ActivityHistoryFilters['action']>> = [
  { value: '', label: 'All actions' },

  ...ADMIN_AUDIT_ACTIONS.map((action) => ({
    value: action,
    label: getAdminAuditActionLabel(action),

    content: withIcon(
      getActionSection(action),
      getAdminAuditActionLabel(action)
    ),
  })),
];

const SECTION_OPTIONS: Array<SelectOption<ActivityHistoryFilters['section']>> =
  [
    { value: '', label: 'All sections' },

    ...ADMIN_AUDIT_SECTIONS.filter((section) => section !== 'profile').map(
      (section) => ({
        value: section,
        label: getAdminAuditSectionLabel(section),
        content: withIcon(section, getAdminAuditSectionLabel(section)),
      })
    ),
  ];

//===================================================================

const ACTOR_TYPE_LABELS: Readonly<Record<AdminAuditActorType, string>> = {
  employee: 'Employee',
  pharmacyOwner: 'Pharmacy owner',
  pharmacyEmployee: 'Pharmacy employee',
};

//===================================================================

const ACTOR_TYPE_OPTIONS: Array<
  SelectOption<ActivityHistoryFilters['actorType']>
> = [
  { value: '', label: 'All' },

  ...ADMIN_AUDIT_ACTOR_TYPES.map((actorType) => ({
    value: actorType,
    label: ACTOR_TYPE_LABELS[actorType],
    content: (
      <span className={css.option}>
        <span className={css.optionIcon}>
          {actorType === 'employee' ? (
            <UserRound size={16} />
          ) : actorType === 'pharmacyOwner' ? (
            <Store size={16} />
          ) : (
            <UserRoundCog size={16} />
          )}
        </span>
        {ACTOR_TYPE_LABELS[actorType]}
      </span>
    ),
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
        label="Date /time"
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

      <div className={css.sectionFilter}>
        <span className={css.help}>
          <InfoTooltip
            label="How activity filters work"
            title="Choose a section first"
            icon={<History size={19} />}
            escapeOverflow
            items={[
              {
                title: 'Select a section',
                description:
                  'Change type becomes available after you choose a section.',
                icon: <MapPinned size={17} />,
              },
              {
                title: 'Narrow the changes',
                description:
                  'Available change types are specific to the selected section.',
                icon: <Search size={17} />,
              },
            ]}
          />
        </span>
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
                    content: withIcon(
                      section,
                      getAdminAuditSectionLabel(section)
                    ),
                  })),
                ]
              : SECTION_OPTIONS
          }
          isActive={Boolean(filters.section)}
          onChange={(section) => onChange({ ...filters, section, action: '' })}
        />
      </div>

      <SelectField
        id="admin-audit-action-filter"
        label="Change type"
        value={filters.action}
        disabled={!filters.section}
        options={ACTION_OPTIONS.filter(
          (option) =>
            !option.value ||
            (filters.section &&
              getActionSection(option.value) === filters.section &&
              (!availableActions || availableActions.includes(option.value)))
        )}
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
    </FilterDrawer>
  );
}
