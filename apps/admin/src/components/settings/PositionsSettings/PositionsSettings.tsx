'use client';

import {
  BriefcaseBusiness,
  LockKeyhole,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';

import type { PositionListItem } from '@e-pharmacy/types/reference-data';

import {
  createAdminPosition,
  deleteAdminPosition,
  getAdminPositions,
  updateAdminPosition,
} from '@/lib/api/browser/admin-positions.api';

import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';

import { SettingsDictionaryPage } from '@/components/settings/SettingsDictionary/SettingsDictionaryPage';
import type { SettingsDictionaryConfig } from '@/components/settings/SettingsDictionary/settings-dictionary.types';

//===================================================================

function renderPositionUsage(item: PositionListItem): string {
  const { employeesCount } = item.usage;

  if (employeesCount === 0) return 'Not applied';

  return `${employeesCount} ${employeesCount === 1 ? 'employee' : 'employees'}`;
}

//===================================================================

const POSITIONS_CONFIG: SettingsDictionaryConfig<PositionListItem> = {
  title: 'Positions',
  pageIcon: <BriefcaseBusiness size={23} aria-hidden="true" />,
  singularLabel: 'position',
  pluralLabel: 'positions',
  addLabel: 'Add position',
  infoTitle: 'Employee positions',
  infoIcon: <BriefcaseBusiness size={20} aria-hidden="true" />,
  infoItems: [
    {
      title: 'What positions are for',
      description:
        'Positions are descriptive employee reference data used to identify an employee’s role in the Admin Cabinet.',
      icon: <UsersRound size={17} aria-hidden="true" />,
    },
    {
      title: 'Permissions stay separate',
      description:
        'A position does not grant permissions. Access is controlled independently by the Admin permission model.',
      icon: <ShieldCheck size={17} aria-hidden="true" />,
    },
    {
      title: 'When a position is in use',
      description:
        'A position assigned to one or more employees cannot be edited or deleted until those assignments are removed.',
      icon: <LockKeyhole size={17} aria-hidden="true" />,
    },
  ],

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
