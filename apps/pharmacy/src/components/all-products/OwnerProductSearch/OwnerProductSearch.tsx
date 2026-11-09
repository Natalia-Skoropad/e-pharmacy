'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { PackageSearch, Search } from 'lucide-react';

import { useDebouncedValue } from '@e-pharmacy/hooks/timing';

import {
  SearchableSelect,
  type SearchableSelectOption,
} from '@e-pharmacy/ui/forms';

import { TableImagePreview } from '@e-pharmacy/ui/media';
import { InfoTooltip } from '@e-pharmacy/ui/overlays';
import type { PharmacyProductsQueryParams } from '@e-pharmacy/types/products';

import type { BrowserReadRequestOptions } from '@/lib/api/browser/request-options';
import { getOwnerCatalogProducts } from '@/lib/api/browser/owner-all-products.api';
import { getProductImageSrc } from '@/lib/products/product-images';

//===================================================================

const SUGGESTIONS_PAGE_SIZE = 20;

//===================================================================

export type ProductSearchItem = Readonly<{
  id: string;
  article: string;
  name: string;
  imageUrl?: string | null;
  photoUrl?: string | null;
}>;

//===================================================================

export type ProductSuggestionsLoader = (
  params: PharmacyProductsQueryParams,
  options?: BrowserReadRequestOptions
) => Promise<{
  items: readonly ProductSearchItem[];
  page: number;
  totalPages: number;
}>;

//===================================================================

type SuggestionsState = Readonly<{
  query: string;
  page: number;
  items: readonly ProductSearchItem[];
  hasMore: boolean;
  unavailable: boolean;
}>;

//===================================================================

function sanitizeSearch(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 120);
}

//===================================================================

const toOption = (
  product: ProductSearchItem
): SearchableSelectOption<string> => ({
  value: product.id,
  label: product.name,
  searchText: `${product.article} ${product.id}`,

  leading: (
    <TableImagePreview
      src={getProductImageSrc(
        product.imageUrl ?? product.photoUrl ?? undefined
      )}
      alt={`${product.name} photo`}
      fallback={product.name.charAt(0)}
      size={30}
    />
  ),
});

//===================================================================

export function OwnerProductSearch({
  value,
  onChange,
  pharmacyId,
  loadProducts = getOwnerCatalogProducts,
  id = 'all-products-product-search',
  description = 'Find an Admin product by article, name or product ID.',
  tooltipTitle = 'Product search',
  tooltipIcon = <PackageSearch size={20} />,
}: {
  value: string;
  onChange: (id: string) => void;
  pharmacyId?: string;
  loadProducts?: ProductSuggestionsLoader;
  id?: string;
  description?: string;
  tooltipTitle?: string;
  tooltipIcon?: ReactNode;
}) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), 250);

  const [suggestions, setSuggestions] = useState<SuggestionsState | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ProductSearchItem | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const requestQuery = debouncedQuery;

    void loadProducts(
      {
        keyword: requestQuery || undefined,
        pharmacyId: pharmacyId || undefined,
        page: 1,
        perPage: SUGGESTIONS_PAGE_SIZE,
        includeBlocked: true,
      },
      { signal: controller.signal }
    )
      .then((response) => {
        if (controller.signal.aborted) return;

        setSuggestions({
          query: requestQuery,
          page: 1,
          items: response.items,
          hasMore: response.page < response.totalPages,
          unavailable: false,
        });
      })
      .catch(() => {
        if (controller.signal.aborted) return;

        setSuggestions({
          query: requestQuery,
          page: 1,
          items: [],
          hasMore: false,
          unavailable: true,
        });
      });

    return () => controller.abort();
  }, [debouncedQuery, loadProducts, pharmacyId]);

  useEffect(() => {
    if (!value || selected?.id === value) return;

    const controller = new AbortController();

    void loadProducts(
      {
        productId: value,
        pharmacyId: pharmacyId || undefined,
        page: 1,
        perPage: 1,
        includeBlocked: true,
      },
      { signal: controller.signal }
    )
      .then((response) => {
        if (!controller.signal.aborted) setSelected(response.items[0] ?? null);
      })
      .catch(() => {
        if (!controller.signal.aborted) setSelected(null);
      });

    return () => controller.abort();
  }, [selected?.id, value, loadProducts, pharmacyId]);

  // Keep outdated suggestions hidden during the debounce without triggering
  // synchronous state updates in the request effect.
  const currentSuggestions =
    suggestions?.query === debouncedQuery && debouncedQuery === query.trim();

  const items = useMemo(
    () => (currentSuggestions ? (suggestions?.items ?? []) : []),
    [currentSuggestions, suggestions]
  );

  const options = useMemo<Array<SearchableSelectOption<string>>>(() => {
    const nextOptions = items.map(toOption);

    if (value && !nextOptions.some((option) => option.value === value)) {
      nextOptions.unshift(
        selected?.id === value ? toOption(selected) : { value, label: value }
      );
    }

    if (!query.trim())
      nextOptions.unshift({ value: '', label: 'All products' });

    return nextOptions;
  }, [items, query, selected, value]);

  const loadMoreOptions = () => {
    if (!currentSuggestions || !suggestions?.hasMore || isLoadingMore) return;

    const controller = new AbortController();
    const nextPage = suggestions.page + 1;

    setIsLoadingMore(true);
    setLoadMoreError(null);

    void loadProducts(
      {
        keyword: debouncedQuery || undefined,
        pharmacyId: pharmacyId || undefined,
        page: nextPage,
        perPage: SUGGESTIONS_PAGE_SIZE,
        includeBlocked: true,
      },
      { signal: controller.signal }
    )
      .then((response) => {
        setSuggestions((currentState) => {
          if (!currentState || currentState.query !== debouncedQuery) {
            return currentState;
          }

          return {
            ...currentState,
            page: response.page,
            items: [...currentState.items, ...response.items],
            hasMore: response.page < response.totalPages,
            unavailable: false,
          };
        });
      })
      .catch(() => {
        setLoadMoreError('Could not load more products.');
      })
      .finally(() => {
        setIsLoadingMore(false);
      });
  };

  return (
    <SearchableSelect
      id={id}
      label="Product search"
      labelAccessory={
        <InfoTooltip
          label="Product search help"
          title={tooltipTitle}
          icon={tooltipIcon}
          items={[
            {
              title: 'Search fields',
              description,
              icon: <Search size={17} />,
            },
          ]}
        />
      }
      value={value}
      options={options}
      placeholder="Article, name, or product ID"
      selectedFallbackLabel={value}
      emptyMessage={
        currentSuggestions && suggestions?.unavailable
          ? 'Suggestions are temporarily unavailable.'
          : 'No products found'
      }
      loadingMessage="Loading products..."
      isActive={Boolean(value)}
      isOptionsLoading={!currentSuggestions}
      filterOptions={false}
      maxLength={120}
      hasMoreOptions={Boolean(currentSuggestions && suggestions?.hasMore)}
      isLoadingMore={isLoadingMore}
      loadMoreError={loadMoreError ?? undefined}
      onLoadMore={loadMoreOptions}
      sanitizeQuery={sanitizeSearch}
      onQueryChange={(nextQuery) => {
        setQuery(nextQuery);
        setLoadMoreError(null);
        setIsLoadingMore(false);
      }}
      onChange={(id) => {
        if (!id) {
          setSelected(null);
          onChange('');
          return;
        }

        const product = items.find((item) => item.id === id);

        if (product) setSelected(product);

        onChange(id);
      }}
    />
  );
}
