'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, UsersRound } from 'lucide-react';

import { useDebouncedValue } from '@e-pharmacy/hooks/timing';
import { formatInitials } from '@e-pharmacy/ui/data-display';

import {
  SearchableSelect,
  type SearchableSelectOption,
} from '@e-pharmacy/ui/forms';

import { TableImagePreview } from '@e-pharmacy/ui/media';
import { InfoTooltip } from '@e-pharmacy/ui/overlays';
import { isValidObjectId } from '@e-pharmacy/validation/url';

import { getPharmacyClients } from '@/lib/api/browser/clients.api';
import type { PharmacyClientRow } from '@/lib/clients/clients';
import { getClientDisplayName } from '@/lib/clients/client-display-name';
import { getProductImageSrc } from '@/lib/products/product-images';

//===================================================================

type OwnerClientSearchProps = Readonly<{
  value: string;
  onChange: (clientId: string) => void;
  embedded?: boolean;
  productId?: string;
  pharmacyId?: string;
  id?: string;
}>;

type Suggestions = Readonly<{
  query: string;
  items: readonly PharmacyClientRow[];
  unavailable: boolean;
  page: number;
  hasMore: boolean;
}>;

//===================================================================

const SEARCH_LIMIT = 100;

//===================================================================

function sanitizeSearch(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 80);
}

//===================================================================

function toOption(client: PharmacyClientRow): SearchableSelectOption<string> {
  return {
    value: client.id,
    label: getClientDisplayName(client),

    leading: (
      <TableImagePreview
        src={getProductImageSrc(client.photoUrl ?? undefined)}
        alt={`${client.name} photo`}
        fallback={formatInitials(client.name, 'C')}
        size={30}
      />
    ),

    searchText: [client.id, client.email, client.phone, client.address]
      .filter(Boolean)
      .join(' '),
  };
}

//===================================================================

function uniqueClients(
  items: readonly PharmacyClientRow[]
): PharmacyClientRow[] {
  const seen = new Set<string>();

  return items.filter((client) => {
    if (seen.has(client.id)) return false;

    seen.add(client.id);

    return true;
  });
}

//===================================================================

export function OwnerClientSearch({
  value,
  onChange,
  embedded = false,
  productId,
  pharmacyId,
  id,
}: OwnerClientSearchProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), 250);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Readonly<{
    id: string;
    client: PharmacyClientRow | null;
  }> | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const currentQuery = debouncedQuery;

    void getPharmacyClients(
      {
        scope: productId || !embedded ? 'owner' : undefined,
        productId,
        pharmacyId: pharmacyId || undefined,
        page: 1,
        perPage: productId ? 50 : SEARCH_LIMIT,
        search: currentQuery || undefined,
      },
      { signal: controller.signal }
    )
      .then((result) => {
        if (!controller.signal.aborted) {
          setSuggestions({
            query: currentQuery,
            items: uniqueClients(result.items),
            unavailable: false,
            page: 1,
            hasMore: Boolean(productId && result.page < result.totalPages),
          });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setSuggestions({
            query: currentQuery,
            items: [],
            unavailable: true,
            page: 1,
            hasMore: false,
          });
        }
      });

    return () => controller.abort();
  }, [debouncedQuery, embedded, productId, pharmacyId]);

  // A direct URL can reference a client outside the first page of suggestions.
  useEffect(() => {
    if (!value || selected?.id === value || !isValidObjectId(value)) return;

    const controller = new AbortController();

    void getPharmacyClients(
      {
        scope: productId || !embedded ? 'owner' : undefined,
        productId,
        pharmacyId: pharmacyId || undefined,
        page: 1,
        perPage: 1,
        clientId: value,
      },
      { signal: controller.signal }
    )
      .then((result) => {
        if (!controller.signal.aborted) {
          setSelected({ id: value, client: result.items[0] ?? null });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setSelected({ id: value, client: null });
      });

    return () => controller.abort();
  }, [selected?.id, value, embedded, productId, pharmacyId]);

  const suggestionsReady =
    suggestions?.query === debouncedQuery && debouncedQuery === query.trim();

  const items = useMemo(
    () => (suggestionsReady ? (suggestions?.items ?? []) : []),
    [suggestionsReady, suggestions]
  );

  const options = useMemo<SearchableSelectOption<string>[]>(() => {
    const result = items.map(toOption);

    if (
      !query.trim() &&
      value &&
      !result.some((item) => item.value === value)
    ) {
      result.unshift(
        selected?.id === value && selected.client
          ? toOption(selected.client)
          : { value, label: value }
      );
    }

    if (!query.trim()) result.unshift({ value: '', label: 'All clients' });

    return result;
  }, [items, query, selected, value]);

  // The product-buyer registry pages suggestions (50 at a time); the
  // ordinary Clients search keeps its existing behavior.
  const loadMore = () => {
    if (!productId || !suggestionsReady || !suggestions?.hasMore || loadingMore)
      return;

    const page = suggestions.page + 1;
    const requestQuery = debouncedQuery;

    setLoadingMore(true);
    setLoadMoreError(null);

    void getPharmacyClients({
      scope: 'owner',
      productId,
      pharmacyId: pharmacyId || undefined,
      search: requestQuery || undefined,
      page,
      perPage: 50,
    })
      .then((result) => {
        setSuggestions((current) =>
          current?.query === requestQuery && current.page === page - 1
            ? {
                ...current,
                page,
                items: uniqueClients([...current.items, ...result.items]),
                hasMore: result.page < result.totalPages,
              }
            : current
        );
      })
      .catch(() => setLoadMoreError('Could not load more clients.'))
      .finally(() => setLoadingMore(false));
  };

  return (
    <SearchableSelect
      id={id ?? (embedded ? 'pharmacy-clients-search' : 'owner-clients-search')}
      label="Client search"
      labelAccessory={
        <InfoTooltip
          label="Client search help"
          title="Client search"
          icon={<UsersRound size={20} aria-hidden="true" />}
          items={[
            {
              title: 'Search fields',
              description:
                'Find a client by ID, name, email, phone number, or address.',
              icon: <Search size={17} aria-hidden="true" />,
            },
          ]}
        />
      }
      value={value}
      options={options}
      placeholder="Name, ID, email, phone, or address"
      emptyMessage={
        suggestionsReady && suggestions?.unavailable
          ? 'Suggestions are temporarily unavailable.'
          : 'No clients found'
      }
      loadingMessage="Loading clients..."
      isActive={Boolean(value)}
      isOptionsLoading={
        !suggestionsReady || Boolean(value && selected?.id !== value)
      }
      hasMoreOptions={Boolean(
        productId && suggestionsReady && suggestions?.hasMore
      )}
      onLoadMore={productId ? loadMore : undefined}
      isLoadingMore={loadingMore}
      loadMoreError={loadMoreError ?? undefined}
      selectedFallbackLabel={value}
      filterOptions={false}
      maxLength={80}
      sanitizeQuery={sanitizeSearch}
      onQueryChange={(value) => {
        setQuery(value);
        setLoadMoreError(null);
      }}
      onChange={(nextValue) => {
        if (!nextValue) {
          setSelected(null);
          onChange('');
          return;
        }

        const client = items.find((item) => item.id === nextValue);

        if (client) setSelected({ id: nextValue, client });

        onChange(nextValue);
      }}
    />
  );
}

export default OwnerClientSearch;
