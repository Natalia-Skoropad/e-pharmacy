'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BriefcaseBusiness, Pencil, Plus, Trash2, X } from 'lucide-react';

import { isApiError } from '@e-pharmacy/api-client/transport';

import {
  CountLabel,
  DataTable,
  TableDateTime,
  type DataTableColumn,
} from '@e-pharmacy/ui/data-display';

import {
  RowsPerPageSelect,
  SearchableSelect,
  type SearchableSelectOption,
  CategoryIcon,
  type RowsPerPageValue,
} from '@e-pharmacy/ui/forms';

import { useToast } from '@e-pharmacy/ui/feedback';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { PaginationView } from '@e-pharmacy/ui/navigation';
import { ConfirmationModal, InfoTooltip } from '@e-pharmacy/ui/overlays';
import { Button, FiltersButton } from '@e-pharmacy/ui/primitives';

import { canAdmin } from '@/lib/permissions/can-admin';
import { useAdminAuthorization } from '@/providers/AdminAuthorizationProvider';

import {
  EMPTY_SETTINGS_DICTIONARY_FILTERS,
  SettingsDictionaryFilters,
  type SettingsDictionaryFiltersValue,
} from './SettingsDictionaryFilters';

import { SettingsDictionaryFormModal } from './SettingsDictionaryFormModal';

import {
  buildSettingsDictionaryUrl,
  parseSettingsDictionarySegments,
  slugForDictionaryItem,
} from './settings-dictionary-url';

import type {
  SettingsDictionaryConfig,
  SettingsDictionaryFormValues,
  SettingsDictionaryItem,
  SettingsDictionaryListResponse,
} from './settings-dictionary.types';

import css from './SettingsDictionary.module.css';

//===================================================================

type FormState<TItem extends SettingsDictionaryItem> =
  | Readonly<{ mode: 'create' }>
  | Readonly<{ mode: 'edit'; item: TItem }>
  | null;

//===================================================================

function getRequestErrorMessage(error: unknown, fallback: string): string {
  if (!isApiError(error)) return fallback;

  if (error.transportCode === 'NETWORK_ERROR') {
    return 'Could not reach the server. Check your connection and try again.';
  }

  if (error.transportCode === 'TIMEOUT') {
    return 'The request took too long. Please try again.';
  }

  if (error.transportCode === 'INVALID_RESPONSE') {
    return 'The server returned an unexpected response. Refresh the data and try again.';
  }

  if (error.httpStatus === 409 && error.message.trim()) {
    return error.message;
  }

  if (error.httpStatus === 403) {
    return 'You do not have permission to perform this operation.';
  }

  if (error.httpStatus === 404) {
    return 'This item no longer exists. Refresh the list and try again.';
  }

  if (error.httpStatus && error.httpStatus >= 500) {
    return 'The Settings service is temporarily unavailable. Please try again later.';
  }

  return fallback;
}

//===================================================================

export function SettingsDictionaryPage<TItem extends SettingsDictionaryItem>({
  config,
}: Readonly<{ config: SettingsDictionaryConfig<TItem> }>) {
  const { access } = useAdminAuthorization();
  const router = useRouter();
  const pathname = usePathname();

  const basePath = config.color
    ? '/admin/settings/categories'
    : '/admin/settings/positions';

  const selectionPrefix = config.color ? 'category' : 'position';

  const url = useMemo(() => {
    const segments = pathname.startsWith(`${basePath}/`)
      ? pathname.slice(basePath.length + 1).split('/')
      : [];

    return parseSettingsDictionarySegments(segments, selectionPrefix);
  }, [pathname, basePath, selectionPrefix]);

  const { filters, selectedSlug, page, perPage } = url;
  const keyword = selectedSlug.replaceAll('-', ' ');
  const toast = useToast();

  const [suggestionQuery, setSuggestionQuery] = useState('');
  const [suggestions, setSuggestions] = useState<readonly TItem[]>([]);

  const [data, setData] =
    useState<SettingsDictionaryListResponse<TItem> | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const [formState, setFormState] = useState<FormState<TItem>>(null);
  const [deleteItem, setDeleteItem] = useState<TItem | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const canCreate = canAdmin(access, config.permissions.create);
  const canEdit = canAdmin(access, config.permissions.edit);
  const canDelete = canAdmin(access, config.permissions.delete);

  const hasDateFilters = Boolean(filters.createdFrom || filters.createdTo);
  const activeFiltersCount = hasDateFilters ? 1 : 0;
  const isFiltered = Boolean(keyword || hasDateFilters);

  const navigate = useCallback(
    (next: {
      selectedSlug?: string;
      filters?: SettingsDictionaryFiltersValue;
      page?: number;
      perPage?: RowsPerPageValue;
    }) => {
      const changed = {
        selectedSlug: next.selectedSlug ?? selectedSlug,
        filters: next.filters ?? filters,
        page: next.page ?? page,
        perPage: next.perPage ?? perPage,
      };

      const nextPath = buildSettingsDictionaryUrl(basePath, changed);
      if (nextPath === pathname) return;

      setIsLoading(true);
      router.push(nextPath);
    },
    [router, basePath, pathname, selectedSlug, filters, page, perPage]
  );

  useEffect(() => {
    const controller = new AbortController();

    const timeout = window.setTimeout(() => {
      void config.api
        .list(
          {
            page: 1,
            perPage: 100,
            ...(suggestionQuery ? { keyword: suggestionQuery } : {}),
          },
          { signal: controller.signal }
        )

        .then((response) => {
          if (!controller.signal.aborted) setSuggestions(response.items);
        })

        .catch(() => {
          if (!controller.signal.aborted) setSuggestions([]);
        });
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [config.api, suggestionQuery, reloadVersion]);

  const searchOptions = useMemo<Array<SearchableSelectOption<string>>>(
    () => [
      { value: '', label: `All ${config.pluralLabel}` },

      ...suggestions.map((item) => ({
        value: slugForDictionaryItem(item, Boolean(config.color)),
        label: item.name,

        leading: (
          <span className={css.searchItemIcon}>
            {config.color ? (
              <CategoryIcon
                name={(item as TItem & { icon?: string }).icon}
                size={16}
              />
            ) : (
              <BriefcaseBusiness size={16} />
            )}
          </span>
        ),
      })),
    ],
    [suggestions, config.color, config.pluralLabel]
  );

  useEffect(() => {
    const controller = new AbortController();
    let keepLoadingForPageCorrection = false;

    void config.api
      .list(
        {
          page,
          perPage,

          ...(keyword ? { keyword } : {}),
          ...(filters.createdFrom ? { createdFrom: filters.createdFrom } : {}),
          ...(filters.createdTo ? { createdTo: filters.createdTo } : {}),
        },
        { signal: controller.signal }
      )

      .then((response) => {
        if (controller.signal.aborted) return;

        if (
          page > 1 &&
          (response.totalPages === 0 || page > response.totalPages)
        ) {
          keepLoadingForPageCorrection = true;
          navigate({ page: Math.max(1, response.totalPages) });
          return;
        }

        setData(response);

        setFormState((current) => {
          if (current?.mode !== 'edit') return current;

          const refreshedItem = response.items.find(
            (item) => item.id === current.item.id
          );

          return refreshedItem
            ? { mode: 'edit', item: refreshedItem }
            : current;
        });

        setListError(null);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        setListError(
          getRequestErrorMessage(
            error,
            `${config.title} could not be loaded. Please try again.`
          )
        );
      })

      .finally(() => {
        if (!controller.signal.aborted && !keepLoadingForPageCorrection) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [
    config.api,
    config.title,
    filters,
    keyword,
    page,
    perPage,
    reloadVersion,
    navigate,
  ]);

  const reload = useCallback(() => {
    setIsLoading(true);
    setReloadVersion((version) => version + 1);
  }, []);

  const closeForm = () => {
    if (isMutating) return;
    setFormState(null);
    setMutationError(null);
  };

  const submitForm = async (values: SettingsDictionaryFormValues) => {
    if (!formState || isMutating) return;

    setIsMutating(true);
    setMutationError(null);

    try {
      if (formState.mode === 'create') {
        await config.api.create(values);

        toast.success(config.messages.created);
        setFormState(null);
        navigate({ page: 1, selectedSlug: '' });
        reload();
      } else {
        await config.api.update(formState.item.id, values);

        toast.success(config.messages.updated);
        setFormState(null);
        reload();
      }
    } catch (error) {
      const message = getRequestErrorMessage(
        error,
        `${config.singularLabel} could not be saved. Please try again.`
      );

      if (
        isApiError(error) &&
        error.httpStatus === 404 &&
        formState.mode === 'edit'
      ) {
        setFormState(null);
        setMutationError(null);
        toast.error(message);
        reload();
      } else {
        setMutationError(message);

        if (isApiError(error) && error.httpStatus === 409) {
          reload();
        }
      }
    } finally {
      setIsMutating(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteItem || isMutating) return;

    setIsMutating(true);

    try {
      await config.api.delete(deleteItem.id);
      toast.success(config.messages.deleted);

      const shouldMoveToPreviousPage =
        page > 1 && (data?.items.length ?? 0) === 1;

      setDeleteItem(null);

      if (shouldMoveToPreviousPage) {
        setIsLoading(true);
        navigate({ page: Math.max(1, page - 1) });
      } else {
        reload();
      }
    } catch (error) {
      toast.error(
        getRequestErrorMessage(
          error,
          `${config.singularLabel} could not be deleted. Please try again.`
        )
      );

      setDeleteItem(null);
      reload();
    } finally {
      setIsMutating(false);
    }
  };

  const openCreate = () => {
    setMutationError(null);
    setFormState({ mode: 'create' });
  };

  const openEdit = useCallback((item: TItem) => {
    setMutationError(null);
    setFormState({ mode: 'edit', item });
  }, []);

  const columns = useMemo<Array<DataTableColumn<TItem>>>(() => {
    const hasColor = Boolean(config.color);
    const createdWidth = hasColor ? '12%' : '16%';
    const colorWidth = '7%';
    const hexWidth = '12%';
    const nameWidth = hasColor ? '17%' : '25%';
    const usageWidth = hasColor ? '32%' : '37%';
    const actionsWidth = '22%';

    const baseColumns: Array<DataTableColumn<TItem>> = [
      {
        key: 'createdAt',
        title: 'Created',
        width: createdWidth,
        render: (item) => <TableDateTime value={item.createdAt} />,
      },
    ];

    if (config.color) {
      baseColumns.push({
        key: 'icon',
        title: 'Icon',
        width: '7%',

        render: (item) => (
          <span className={css.searchItemIcon}>
            <CategoryIcon
              name={(item as TItem & { icon?: string }).icon}
              size={18}
            />
          </span>
        ),
      });

      baseColumns.push({
        key: 'color',
        title: 'Color',
        width: colorWidth,

        render: (item) => {
          const color = config.color?.getColor(item) ?? '';

          return (
            <span
              className={css.colorSwatch}
              style={{ backgroundColor: color }}
              role="img"
              aria-label={`Color ${color}`}
              title={color}
            />
          );
        },
      });
    }

    if (config.color) {
      baseColumns.push({
        key: 'hex',
        title: 'HEX',
        width: hexWidth,

        render: (item) => (
          <code className={css.hexValue}>
            {config.color?.getColor(item).toUpperCase()}
          </code>
        ),
      });
    }

    baseColumns.push({
      key: 'name',
      title: 'Name',
      width: nameWidth,
      render: (item) => <strong className={css.itemName}>{item.name}</strong>,
    });

    baseColumns.push(
      {
        key: 'usage',
        title: config.appliedToColumnTitle ?? 'Applied to',
        width: usageWidth,
        render: config.renderUsage,
      },
      {
        key: 'actions',
        title: 'Actions',
        width: actionsWidth,
        render: (item) => {
          const isInUse = item.usage.total > 0;
          const editDisabled = !canEdit || (isInUse && !config.color);
          const deleteDisabled = !canDelete || isInUse;

          let editDisabledReason: string | undefined;
          let deleteDisabledReason: string | undefined;

          if (!canEdit) {
            editDisabledReason =
              'You do not have permission to edit this item.';
          } else if (editDisabled && isInUse) {
            editDisabledReason = config.usageLockMessage;
          }

          if (!canDelete) {
            deleteDisabledReason =
              'You do not have permission to delete this item.';
          } else if (deleteDisabled && isInUse) {
            deleteDisabledReason = config.usageLockMessage;
          }

          return (
            <span className={css.actionsCell}>
              <Button
                className={css.editButton}
                type="button"
                variant="ghost"
                size="sm"
                iconLeft={<Pencil size={16} aria-hidden="true" />}
                disabled={editDisabled}
                title={editDisabledReason}
                onClick={() => openEdit(item)}
              >
                Edit
              </Button>

              <Button
                className={css.deleteButton}
                type="button"
                variant="ghost"
                size="sm"
                iconLeft={<Trash2 size={16} aria-hidden="true" />}
                disabled={deleteDisabled}
                title={deleteDisabledReason}
                onClick={() => setDeleteItem(item)}
              >
                Delete
              </Button>
            </span>
          );
        },
      }
    );

    return baseColumns;
  }, [canDelete, canEdit, config, openEdit]);

  const items = data?.items ?? [];

  const selectedEditItem =
    formState?.mode === 'edit' ? formState.item : undefined;

  return (
    <main className={css.page} aria-labelledby="settings-dictionary-title">
      <section className={css.card} aria-labelledby="settings-dictionary-title">
        <PageHeader
          title={
            <span className={css.titleWithHelp}>
              <span>{config.title}</span>
              <InfoTooltip
                label={`About ${config.title}`}
                title={config.infoTitle}
                icon={config.infoIcon}
                items={config.infoItems}
                escapeOverflow
              />
            </span>
          }
          titleId="settings-dictionary-title"
          icon={config.pageIcon}
        />
      </section>

      <section className={css.card} aria-label={`${config.title} filters`}>
        <div className={css.searchGrid}>
          <SearchableSelect
            id="settings-dictionary-search"
            label="Search by name"
            value={selectedSlug}
            options={searchOptions}
            selectedFallbackLabel={selectedSlug.replaceAll('-', ' ')}
            placeholder={config.searchPlaceholder}
            isActive={Boolean(selectedSlug)}
            maxLength={100}
            filterOptions={false}
            onQueryChange={setSuggestionQuery}
            onChange={(slug) => navigate({ selectedSlug: slug, page: 1 })}
          />

          <div className={css.searchAction}>
            <FiltersButton
              className={css.filterButton}
              activeCount={activeFiltersCount}
              controlsId="settings-dictionary-filters-panel"
              isExpanded={isFiltersOpen}
              onClick={() => setIsFiltersOpen(true)}
            />
          </div>
        </div>
      </section>

      <section className={css.card} aria-label={`${config.title} table`}>
        <div className={css.toolbar}>
          <div className={css.rowsControl}>
            <RowsPerPageSelect
              value={perPage}
              options={config.rowsPerPageOptions ?? [20, 50, 100]}
              disabled={isLoading && !data}
              onChange={(value) => {
                navigate({ perPage: value, page: 1 });
              }}
            />
          </div>

          {canCreate ? (
            <Button
              className={css.createButton}
              type="button"
              iconLeft={<Plus size={18} aria-hidden="true" />}
              onClick={openCreate}
            >
              {config.addLabel}
            </Button>
          ) : null}

          <CountLabel
            className={css.countLabel}
            shown={items.length}
            total={data?.total ?? 0}
            label={config.pluralLabel}
          />
        </div>

        {listError ? (
          <div className={css.inlineError} role="alert">
            <span>{listError}</span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={reload}
            >
              Retry
            </Button>
          </div>
        ) : null}

        <DataTable
          className={css.dictionaryTable}
          columns={columns}
          items={items}
          getItemKey={(item) => item.id}
          isLoading={isLoading && !data}
          minWidth={config.color ? 900 : 840}
          ariaLabel={`${config.title} table`}
          labels={{
            loading: `Loading ${config.pluralLabel}...`,
            empty: isFiltered ? config.filteredEmptyLabel : config.emptyLabel,
          }}
        />

        <PaginationView
          currentPage={data?.page ?? page}
          totalPages={data?.totalPages ?? 0}
          disabled={isLoading}
          ariaLabel={`${config.title} pagination`}
          onPageChange={(nextPage) => {
            navigate({ page: nextPage });
          }}
        />
      </section>

      {isFiltersOpen ? (
        <SettingsDictionaryFilters
          title={config.title}
          filters={filters}
          earliestCreatedAt={data?.earliestCreatedAt ?? undefined}
          hasActiveFilters={hasDateFilters}
          onChange={(nextFilters) => {
            navigate({ filters: nextFilters, page: 1 });
          }}
          onReset={() => {
            navigate({ filters: EMPTY_SETTINGS_DICTIONARY_FILTERS, page: 1 });
          }}
          onClose={() => setIsFiltersOpen(false)}
        />
      ) : null}

      {formState ? (
        <SettingsDictionaryFormModal
          key={
            formState.mode === 'edit' ? `edit:${formState.item.id}` : 'create'
          }
          mode={formState.mode}
          item={selectedEditItem}
          contextLabel={config.title}
          singularLabel={config.singularLabel}
          nameDisabled={Boolean(selectedEditItem?.usage.total)}
          defaultColor={config.color?.defaultColor}
          currentColor={
            selectedEditItem && config.color
              ? config.color.getColor(selectedEditItem)
              : undefined
          }
          isSubmitting={isMutating}
          submitError={mutationError}
          onSubmit={submitForm}
          onClose={closeForm}
        />
      ) : null}

      {deleteItem ? (
        <ConfirmationModal
          isOpen
          title={`Delete “${deleteItem.name}”?`}
          description="This action cannot be undone."
          eyebrow={config.title}
          confirmLabel={`Delete ${config.singularLabel}`}
          cancelLabel={`Keep ${config.singularLabel}`}
          confirmIconLeft={<Trash2 size={17} aria-hidden="true" />}
          cancelIconLeft={<X size={17} aria-hidden="true" />}
          destructive
          isLoading={isMutating}
          closeOnBackdrop={!isMutating}
          closeOnEscape={!isMutating}
          onConfirm={confirmDelete}
          onCancel={() => {
            if (!isMutating) setDeleteItem(null);
          }}
        />
      ) : null}
    </main>
  );
}
