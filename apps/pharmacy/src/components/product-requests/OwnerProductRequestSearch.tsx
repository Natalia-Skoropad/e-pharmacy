'use client';

import { useEffect, useMemo, useState } from 'react';
import { FilePlus2, Search } from 'lucide-react';

import { useDebouncedValue } from '@e-pharmacy/hooks/timing';
import {
  SearchableSelect,
  type SearchableSelectOption,
} from '@e-pharmacy/ui/forms';

import { TableImagePreview } from '@e-pharmacy/ui/media';
import { InfoTooltip } from '@e-pharmacy/ui/overlays';

import type {
  ProductRequestRowViewModel,
  ProductRequestsQueryParams,
} from '@/lib/product-requests/product-requests';

import { getPharmacyProductRequests } from '@/lib/api/browser';
import { getProductImageSrc } from '@/lib/products/product-images';

//===================================================================

const PAGE_SIZE = 20;

//===================================================================

type SuggestionsState = Readonly<{
  query: string;
  scopeKey: string;
  page: number;
  items: readonly ProductRequestRowViewModel[];
  hasMore: boolean;
  unavailable: boolean;
}>;

//===================================================================

function sanitizeQuery(value: string) {
  return value.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 120);
}

//===================================================================

function toOption(
  request: ProductRequestRowViewModel
): SearchableSelectOption<string> {
  return {
    value: request.id,
    label: request.productName,
    searchText: `${request.requestNumber} ${request.productArticle} ${request.id}`,

    leading: (
      <TableImagePreview
        src={getProductImageSrc(request.productImageUrl)}
        alt={`${request.productName} photo`}
        fallback={request.productName.charAt(0)}
        size={30}
      />
    ),
  };
}

//===================================================================

export function OwnerProductRequestSearch({
  value,
  onChange,
  relatedFilters,
}: Readonly<{
  value: string;
  onChange: (id: string, linkedProductId?: string) => void;
  relatedFilters: ProductRequestsQueryParams;
}>) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), 250);
  const scopeKey = JSON.stringify(relatedFilters);
  const [suggestions, setSuggestions] = useState<SuggestionsState | null>(null);

  const [selected, setSelected] = useState<ProductRequestRowViewModel | null>(
    null
  );

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const requestQuery = debouncedQuery;

    void getPharmacyProductRequests(
      {
        ...relatedFilters,
        keyword: requestQuery || undefined,
        page: 1,
        perPage: PAGE_SIZE,
      },
      { signal: controller.signal }
    )
      .then((response) => {
        if (controller.signal.aborted) return;

        setSuggestions({
          query: requestQuery,
          scopeKey,
          page: response.page,
          items: response.items,
          hasMore: response.page < response.totalPages,
          unavailable: false,
        });
      })
      .catch(() => {
        if (controller.signal.aborted) return;

        setSuggestions({
          query: requestQuery,
          scopeKey,
          page: 1,
          items: [],
          hasMore: false,
          unavailable: true,
        });
      });

    return () => controller.abort();
  }, [debouncedQuery, relatedFilters, scopeKey]);

  useEffect(() => {
    if (!value || selected?.id === value) return;

    const controller = new AbortController();

    void getPharmacyProductRequests(
      { requestId: value, page: 1, perPage: 1 },
      { signal: controller.signal }
    )
      .then((response) => {
        if (!controller.signal.aborted) setSelected(response.items[0] ?? null);
      })
      .catch(() => {
        if (!controller.signal.aborted) setSelected(null);
      });

    return () => controller.abort();
  }, [selected?.id, value]);

  const currentSuggestions =
    suggestions?.scopeKey === scopeKey &&
    suggestions?.query === debouncedQuery &&
    debouncedQuery === query.trim();

  const items = useMemo(
    () => (currentSuggestions ? (suggestions?.items ?? []) : []),
    [currentSuggestions, suggestions]
  );

  const options = useMemo<Array<SearchableSelectOption<string>>>(() => {
    const next = items.map(toOption);

    if (value && !next.some((item) => item.value === value)) {
      next.unshift(
        selected?.id === value
          ? toOption(selected)
          : { value, label: 'Selected request' }
      );
    }

    if (!query.trim()) next.unshift({ value: '', label: 'All requests' });

    return next;
  }, [items, query, selected, value]);

  const loadMoreOptions = () => {
    if (!currentSuggestions || !suggestions?.hasMore || isLoadingMore) return;

    const requestQuery = debouncedQuery;
    const nextPage = suggestions.page + 1;

    setIsLoadingMore(true);
    setLoadMoreError(null);

    void getPharmacyProductRequests({
      ...relatedFilters,
      keyword: requestQuery || undefined,
      page: nextPage,
      perPage: PAGE_SIZE,
    })
      .then((response) => {
        setSuggestions((current) => {
          if (
            !current ||
            current.query !== requestQuery ||
            current.scopeKey !== scopeKey
          )
            return current;

          return {
            ...current,
            page: response.page,
            items: [...current.items, ...response.items],
            hasMore: response.page < response.totalPages,
            unavailable: false,
          };
        });
      })
      .catch(() => setLoadMoreError('Could not load more requests.'))
      .finally(() => setIsLoadingMore(false));
  };

  return (
    <SearchableSelect
      id="product-requests-request-search"
      label="Product request search"
      labelAccessory={
        <InfoTooltip
          label="Product request search help"
          title="Product request search"
          icon={<FilePlus2 size={20} />}
          items={[
            {
              title: 'Search fields',
              description:
                'Find an owner product request by request number, product article or product name.',
              icon: <Search size={17} />,
            },
          ]}
        />
      }
      value={value}
      options={options}
      placeholder="Request number, article, or name"
      selectedFallbackLabel={
        selected?.id === value ? selected.productName : 'Selected request'
      }
      emptyMessage={
        currentSuggestions && suggestions?.unavailable
          ? 'Suggestions are temporarily unavailable.'
          : 'No requests found'
      }
      loadingMessage="Loading requests..."
      isActive={Boolean(value)}
      isOptionsLoading={!currentSuggestions}
      filterOptions={false}
      maxLength={120}
      hasMoreOptions={Boolean(currentSuggestions && suggestions?.hasMore)}
      isLoadingMore={isLoadingMore}
      loadMoreError={loadMoreError ?? undefined}
      onLoadMore={loadMoreOptions}
      sanitizeQuery={sanitizeQuery}
      onQueryChange={(nextQuery) => {
        setQuery(nextQuery);
        setLoadMoreError(null);
        setIsLoadingMore(false);
      }}
      onChange={(requestId) => {
        if (!requestId) {
          setSelected(null);
          onChange('');
          return;
        }

        const found =
          items.find((request) => request.id === requestId) ??
          (selected?.id === requestId ? selected : undefined);

        if (found) setSelected(found);

        onChange(requestId, found?.productId);
      }}
    />
  );
}
