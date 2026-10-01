import type { ReactNode } from 'react';

import type { CalendarDateString } from '@e-pharmacy/types/primitives';
import type { RowsPerPageValue } from '@e-pharmacy/ui/forms';
import type { InfoTooltipItem } from '@e-pharmacy/ui/overlays';

import type { AdminPermission } from '@/lib/permissions/admin-permissions';
import type { SettingsDictionaryListQuery } from '@/lib/settings/settings-dictionary';

//===================================================================

export type SettingsDictionaryUsage = Readonly<{ total: number }>;

//===================================================================

export type SettingsDictionaryItem = Readonly<{
  id: string;
  name: string;
  createdAt: string;
  usage: SettingsDictionaryUsage;
}>;

//===================================================================

export type SettingsDictionaryListResponse<
  TItem extends SettingsDictionaryItem,
> = Readonly<{
  items: readonly TItem[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  earliestCreatedAt: CalendarDateString | null;
}>;

//===================================================================

export type SettingsDictionaryFormValues = Readonly<{
  name: string;
  color?: string;
}>;

//===================================================================

export type SettingsDictionaryApi<TItem extends SettingsDictionaryItem> =
  Readonly<{
    list: (
      query: SettingsDictionaryListQuery,
      options?: Readonly<{ signal?: AbortSignal }>
    ) => Promise<SettingsDictionaryListResponse<TItem>>;

    create: (values: SettingsDictionaryFormValues) => Promise<unknown>;
    update: (
      itemId: string,
      values: SettingsDictionaryFormValues
    ) => Promise<unknown>;
    delete: (itemId: string) => Promise<void>;
  }>;

//===================================================================

export type SettingsDictionaryColorConfig<
  TItem extends SettingsDictionaryItem,
> = Readonly<{
  defaultColor: string;
  getColor: (item: TItem) => string;
}>;

//===================================================================

export type SettingsDictionaryConfig<TItem extends SettingsDictionaryItem> =
  Readonly<{
    title: string;
    pageIcon: ReactNode;
    singularLabel: string;
    pluralLabel: string;
    addLabel: string;
    infoTitle: string;
    infoIcon?: ReactNode;
    infoItems: readonly InfoTooltipItem[];
    searchPlaceholder: string;
    appliedToColumnTitle?: ReactNode;
    renderUsage: (item: TItem) => ReactNode;
    usageLockMessage: string;
    emptyLabel: string;
    filteredEmptyLabel: string;

    permissions: Readonly<{
      create: AdminPermission;
      edit: AdminPermission;
      delete: AdminPermission;
    }>;

    messages: Readonly<{
      created: string;
      updated: string;
      deleted: string;
    }>;

    api: SettingsDictionaryApi<TItem>;
    color?: SettingsDictionaryColorConfig<TItem>;
    rowsPerPageOptions?: readonly RowsPerPageValue[];
  }>;
