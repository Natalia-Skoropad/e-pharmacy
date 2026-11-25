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

import { getAdminProductRequests } from '@/lib/api/browser/admin-product-requests.api';

import type {
  ProductRequestRowViewModel,
  ProductRequestsQueryParams,
} from '@/lib/product-requests/admin-product-requests';

import { getProductRequestImageSrc } from '@/lib/product-requests/product-request-images';

//===================================================================

const PAGE_SIZE = 20;

const sanitizeQuery = (value: string) =>
  value.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 120);

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
        src={getProductRequestImageSrc(request.productImageUrl)}
        alt={`${request.productName} photo`}
        fallback={request.productName.charAt(0)}
        size={30}
      />
    ),
  };
}

//===================================================================

type Result = Readonly<{
  query: string;
  page: number;
  items: readonly ProductRequestRowViewModel[];
  hasMore: boolean;
  unavailable: boolean;
}>;

//===================================================================

// Parent keys this component by scope; a change of owner or other filters cancels the old generation.
export function ProductRequestSearch({
  value,
  relatedFilters,
  onChange,
}: Readonly<{
  value: string;
  relatedFilters: ProductRequestsQueryParams;
  onChange: (id: string) => void;
}>) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), 250);
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  const [pageError, setPageError] = useState<{
    query: string;
    page: number;
  } | null>(null);

  const [selected, setSelected] = useState<{
    id: string;
    row: ProductRequestRowViewModel | null;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void getAdminProductRequests(
      {
        ...relatedFilters,
        keyword: debouncedQuery || undefined,
        page,
        perPage: PAGE_SIZE,
      },
      { signal: controller.signal }
    )
      .then((response) => {
        if (controller.signal.aborted) return;

        setResult((previous) => ({
          query: debouncedQuery,
          page,
          hasMore: response.page < response.totalPages,
          unavailable: false,

          items:
            page > 1 && previous?.query === debouncedQuery
              ? [
                  ...previous.items,
                  ...response.items.filter(
                    (item) => !previous.items.some((old) => old.id === item.id)
                  ),
                ]
              : response.items,
        }));
        setPageError(null);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        if (page > 1) setPageError({ query: debouncedQuery, page });
        else
          setResult({
            query: debouncedQuery,
            page,
            items: [],
            hasMore: false,
            unavailable: true,
          });
      });

    return () => controller.abort();
  }, [debouncedQuery, page, relatedFilters, retry]);

  useEffect(() => {
    if (!value || selected?.id === value) return;

    const controller = new AbortController();

    void getAdminProductRequests(
      { requestId: value, page: 1, perPage: 1 },
      { signal: controller.signal }
    )
      .then((response) => {
        if (!controller.signal.aborted)
          setSelected({ id: value, row: response.items[0] ?? null });
      })
      .catch(() => {
        if (!controller.signal.aborted) setSelected({ id: value, row: null });
      });

    return () => controller.abort();
  }, [value, selected?.id]);

  const current =
    result?.query === debouncedQuery && debouncedQuery === query.trim();

  const items = useMemo(
    () => (current ? (result?.items ?? []) : []),
    [current, result]
  );

  const selectedRow = selected?.id === value ? selected.row : null;

  const failedPage =
    pageError?.query === debouncedQuery && pageError.page === page;

  const initialError = Boolean(current && result?.unavailable);

  const loadingMore =
    page > 1 && current && result?.page !== page && !failedPage;

  const options = useMemo(() => {
    const next = items.map(toOption);

    if (!query.trim()) {
      if (value && !next.some((option) => option.value === value))
        next.unshift(
          selectedRow
            ? toOption(selectedRow)
            : { value, label: 'Selected request' }
        );

      next.unshift({ value: '', label: 'All requests' });

      if (current && !result?.unavailable && items.length === 0)
        next.push({
          value: '__empty__',
          label: 'No requests found',
          disabled: true,
        });
    }

    return next;
  }, [items, query, value, selectedRow, current, result?.unavailable]);

  return (
    <SearchableSelect
      id="product-requests-request-search"
      label="Product request search"
      labelAccessory={
        <InfoTooltip
          label="Product request search help"
          title="Product request search"
          icon={<FilePlus2 size={20} aria-hidden="true" />}
          items={[
            {
              title: 'Search fields',
              description:
                'Find a product request by request number, product article or product name.',
              icon: <Search size={17} aria-hidden="true" />,
            },
          ]}
        />
      }
      value={value}
      options={options}
      placeholder="Request number, article, or name"
      selectedFallbackLabel={selectedRow?.productName ?? 'Selected request'}
      emptyMessage={
        current && result?.unavailable
          ? 'Suggestions are temporarily unavailable.'
          : 'No requests found'
      }
      loadingMessage="Loading requests..."
      isActive={Boolean(value)}
      isOptionsLoading={!current || Boolean(value && selected?.id !== value)}
      filterOptions={false}
      maxLength={120}
      sanitizeQuery={sanitizeQuery}
      hasMoreOptions={Boolean(current && result?.hasMore)}
      isLoadingMore={loadingMore}
      loadMoreError={
        initialError
          ? 'Suggestions are temporarily unavailable.'
          : failedPage
            ? 'Could not load more requests.'
            : undefined
      }
      loadMoreErrorVariant="notice"
      onLoadMore={() => {
        if (initialError) {
          setResult(null);
          setRetry((v) => v + 1);
          return;
        }

        if (!current || loadingMore || !result?.hasMore) return;

        if (failedPage) {
          setPageError(null);
          setRetry((v) => v + 1);
        } else setPage((v) => v + 1);
      }}
      onQueryChange={(next) => {
        setQuery(next);
        setPage(1);
        setPageError(null);
      }}
      onChange={(id) => {
        const found = items.find((item) => item.id === id);

        setSelected(found ? { id, row: found } : null);
        onChange(id);
      }}
    />
  );
}
