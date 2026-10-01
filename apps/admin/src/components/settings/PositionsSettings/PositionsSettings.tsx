'use client';

import type { PositionListItem } from '@e-pharmacy/types/reference-data';

import { SettingsDictionaryPage } from '@/components/settings/SettingsDictionary/SettingsDictionaryPage';
import type { SettingsDictionaryConfig } from '@/components/settings/SettingsDictionary/settings-dictionary.types';

import {
  createAdminPosition,
  deleteAdminPosition,
  getAdminPositions,
  updateAdminPosition,
} from '@/lib/api/browser/admin-positions.api';

import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';

//===================================================================

function renderPositionUsage(item: PositionListItem): string {
  const { employeesCount } = item.usage;

  if (employeesCount === 0) return 'Not applied';

  return `${employeesCount} ${employeesCount === 1 ? 'employee' : 'employees'}`;
}

//===================================================================

const POSITIONS_CONFIG: SettingsDictionaryConfig<PositionListItem> = {
  title: 'Positions',
  singularLabel: 'position',
  pluralLabel: 'positions',
  infoTitle: 'Employee positions',

  infoDescription:
    'Positions are descriptive employee reference data. They do not grant admin permissions. A position that is assigned to an employee cannot be edited or deleted.',

  searchPlaceholder: 'Search positions',
  appliedToColumnTitle: 'Applied to',
  renderUsage: renderPositionUsage,

  usageLockMessage:
    'This position is assigned to one or more employees and cannot be edited or deleted.',

  emptyLabel: 'No positions have been created yet.',
  filteredEmptyLabel: 'No positions match the current search or filters.',

  permissions: {
    create: ADMIN_PERMISSIONS.positions.create,
    edit: ADMIN_PERMISSIONS.positions.edit,
    delete: ADMIN_PERMISSIONS.positions.delete,
  },

  messages: {
    created: 'Position was created successfully.',
    updated: 'Position was updated successfully.',
    deleted: 'Position was deleted successfully.',
  },

  api: {
    list: getAdminPositions,
    create: ({ name }) => createAdminPosition({ name }),
    update: (positionId, { name }) => updateAdminPosition(positionId, { name }),
    delete: deleteAdminPosition,
  },
};

//===================================================================

export function PositionsSettings() {
  return <SettingsDictionaryPage config={POSITIONS_CONFIG} />;
}
