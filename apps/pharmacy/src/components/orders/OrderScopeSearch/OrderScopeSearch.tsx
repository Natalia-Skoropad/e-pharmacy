'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, ShoppingBag, UsersRound } from 'lucide-react';

import { useDebouncedValue } from '@e-pharmacy/hooks/timing';

import {
  SearchableSelect,
  type SearchableSelectOption,
} from '@e-pharmacy/ui/forms';

import { TableImagePreview } from '@e-pharmacy/ui/media';
import { formatInitials } from '@e-pharmacy/ui/data-display';
import { InfoTooltip } from '@e-pharmacy/ui/overlays';

import { getProductImageSrc } from '@/lib/products/product-images';

import {
  getOwnerOrderOptions,
  type OrderOption,
} from '@/lib/api/browser/orders.api';

import css from './OrderScopeSearch.module.css';

//===================================================================

type OrderScopeSearchProps = Readonly<{
  kind: 'order' | 'client';
  pharmacyId: string;
  productId?: string;
  relatedId: string;
  value: string;
  onChange: (value: string) => void;
}>;

type Suggestions = Readonly<{
  query: string;
  items: readonly OrderOption[];
  page: number;
  totalPages: number;
  error: boolean;
}>;

//===================================================================

function sanitizeSearch(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 80);
}

//===================================================================

/** All matching orders are queried on the server in 50-item stages. */
export function OrderScopeSearch({
  kind,
  pharmacyId,
  productId,
  relatedId,
  value,
  onChange,
}: OrderScopeSearchProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 250);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);
  const [remembered, setRemembered] = useState<OrderOption | null>(null);
  const requestKey = `${kind}\u0000${pharmacyId}\u0000${productId ?? ''}\u0000${relatedId}\u0000${debouncedSearch}`;
  const [loadedKey, setLoadedKey] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    void getOwnerOrderOptions(
      {
        kind,
        pharmacyId: pharmacyId || undefined,
        productId: productId || undefined,

        ...(kind === 'order'
          ? { clientId: relatedId || undefined }
          : { orderId: relatedId || undefined }),

        search: debouncedSearch || undefined,
        page: 1,
        perPage: 50,
      },
      { signal: controller.signal }
    )
      .then((result) => {
        if (!controller.signal.aborted) {
          setSuggestions({
            query: requestKey,
            items: result.items,
            page: 1,
            totalPages: result.totalPages,
            error: false,
          });

          setLoadedKey(requestKey);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setSuggestions({
            query: requestKey,
            items: [],
            page: 1,
            totalPages: 0,
            error: true,
          });

          setLoadedKey(requestKey);
        }
      });

    return () => controller.abort();
  }, [debouncedSearch, kind, pharmacyId, productId, relatedId, requestKey]);

  // Hydrate selected labels when the URL is opened directly or the selected
  // entry is beyond the first 50 suggestions. Never expose only a raw ID in UI.
  useEffect(() => {
    if (!value) return;

    const controller = new AbortController();

    void getOwnerOrderOptions(
      {
        kind,
        pharmacyId: pharmacyId || undefined,
        productId: productId || undefined,

        ...(kind === 'order'
          ? { orderId: value, clientId: relatedId || undefined }
          : { clientId: value, orderId: relatedId || undefined }),

        page: 1,
        perPage: 1,
      },
      { signal: controller.signal }
    )
      .then((result) => {
        if (!controller.signal.aborted) {
          const selected = result.items.find((item) => item.id === value);

          if (selected) setRemembered(selected);
        }
      })
      .catch(() => {
        // Suggested options remain usable even when label hydration fails.
      });

    return () => controller.abort();
  }, [kind, pharmacyId, productId, relatedId, value]);

  const ready = loadedKey === requestKey && suggestions?.query === requestKey;

  const items = useMemo(
    () => (ready ? (suggestions?.items ?? []) : []),
    [ready, suggestions]
  );

  const options = useMemo<SearchableSelectOption<string>[]>(() => {
    const result: SearchableSelectOption<string>[] = [];

    if (!search.trim())
      result.push({
        value: '',
        label: kind === 'order' ? 'All orders' : 'All clients',
      });

    for (const item of items) {
      result.push({
        value: item.id,
        label: item.label,
        searchText: item.id,

        leading:
          kind === 'client' ? (
            <TableImagePreview
              src={getProductImageSrc(item.photoUrl)}
              alt={`${item.label} photo`}
              fallback={formatInitials(item.label, 'C')}
              size={30}
            />
          ) : (
            <span className={css.orderSearchIcon} aria-hidden="true">
              <ShoppingBag size={16} />
            </span>
          ),
      });
    }

    if (value && !result.some((item) => item.value === value)) {
      result.push({
        value,
        label: remembered?.id === value ? remembered.label : value,

        ...(remembered?.id === value
          ? {
              leading:
                kind === 'client' ? (
                  <TableImagePreview
                    src={getProductImageSrc(remembered.photoUrl)}
                    alt={`${remembered.label} photo`}
                    fallback={formatInitials(remembered.label, 'C')}
                    size={30}
                  />
                ) : (
                  <span className={css.orderSearchIcon} aria-hidden="true">
                    <ShoppingBag size={16} />
                  </span>
                ),
            }
          : {}),
      });
    }

    return result;
  }, [items, kind, remembered, search, value]);

  const loadMore = () => {
    if (
      !ready ||
      !suggestions ||
      loadingMore ||
      suggestions.page >= suggestions.totalPages
    )
      return;

    const page = suggestions.page + 1;

    setLoadingMore(true);
    setMoreError(null);

    void getOwnerOrderOptions({
      kind,
      pharmacyId: pharmacyId || undefined,
      productId: productId || undefined,

      ...(kind === 'order'
        ? { clientId: relatedId || undefined }
        : { orderId: relatedId || undefined }),

      search: debouncedSearch || undefined,
      page,
      perPage: 50,
    })
      .then((result) =>
        setSuggestions((current) =>
          current?.query === requestKey && current.page === page - 1
            ? {
                ...current,
                page,
                totalPages: result.totalPages,
                items: [...current.items, ...result.items],
              }
            : current
        )
      )
      .catch(() => setMoreError('Could not load more suggestions.'))
      .finally(() => setLoadingMore(false));
  };

  const isClient = kind === 'client';

  return (
    <SearchableSelect
      id={isClient ? 'orders-client-search' : 'orders-order-search'}
      label={isClient ? 'Client search' : 'Order search'}
      labelAccessory={
        <InfoTooltip
          label={isClient ? 'Client search help' : 'Order search help'}
          title={isClient ? 'Client search' : 'Order search'}
          icon={isClient ? <UsersRound size={20} /> : <ShoppingBag size={20} />}
          items={[
            {
              title: 'Search fields',
              icon: <Search size={17} />,
              description: isClient
                ? 'Search by client name, ID, email, phone number, or address. Only clients who placed orders in the selected pharmacies are listed.'
                : 'Search by order number or comment. Suggestions are limited to orders from the selected pharmacies and client.',
            },
          ]}
        />
      }
      value={value}
      options={options}
      placeholder={
        isClient
          ? 'Name, ID, email, phone, or address'
          : 'Order number or comment'
      }
      selectedFallbackLabel={
        remembered?.id === value ? remembered.label : value
      }
      isOptionsLoading={!ready}
      loadingMessage={isClient ? 'Loading clients...' : 'Loading orders...'}
      emptyMessage={
        ready && suggestions?.error
          ? 'Suggestions are unavailable.'
          : isClient
            ? 'No clients found'
            : 'No orders found'
      }
      error={
        ready && suggestions?.error
          ? 'Could not load suggestions. Try again.'
          : undefined
      }
      hasMoreOptions={Boolean(
        ready && suggestions && suggestions.page < suggestions.totalPages
      )}
      onLoadMore={loadMore}
      isLoadingMore={loadingMore}
      loadMoreError={moreError ?? undefined}
      filterOptions={false}
      pageSize={50}
      maxLength={80}
      sanitizeQuery={sanitizeSearch}
      onQueryChange={(next) => {
        setSearch(next);
        setMoreError(null);
      }}
      isActive={Boolean(value)}
      onChange={(next) => {
        setRemembered(items.find((item) => item.id === next) ?? null);
        onChange(next);
      }}
    />
  );
}
