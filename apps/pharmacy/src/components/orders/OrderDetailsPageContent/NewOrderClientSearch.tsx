'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, UsersRound, UserRound } from 'lucide-react';

import { useDebouncedValue } from '@e-pharmacy/hooks/timing';

import {
  SearchableSelect,
  type SearchableSelectOption,
} from '@e-pharmacy/ui/forms';

import { TableImagePreview } from '@e-pharmacy/ui/media';
import { InfoTooltip } from '@e-pharmacy/ui/overlays';
import { formatInitials } from '@e-pharmacy/ui/data-display';

import type { PharmacyClientRow } from '@/lib/clients/clients';
import { getPharmacyClients } from '@/lib/api/browser/clients.api';
import { getClientDisplayName } from '@/lib/clients/client-display-name';
import { getProductImageSrc } from '@/lib/products/product-images';

//===================================================================

const PAGE_SIZE = 50;

//===================================================================

type SuggestionState = Readonly<{
  key: string;
  items: readonly PharmacyClientRow[];
  page: number;
  totalPages: number;
  error: boolean;
}>;

//===================================================================

function cleanSearch(query: string) {
  return query.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 80);
}

//===================================================================

function getOption(client: PharmacyClientRow): SearchableSelectOption<string> {
  const name = getClientDisplayName(client);

  return {
    value: client.id,
    label: name,

    searchText: [client.id, client.email, client.phone, client.address]
      .filter(Boolean)
      .join(' '),

    leading: (
      <TableImagePreview
        src={getProductImageSrc(client.photoUrl ?? undefined)}
        alt={`${name} photo`}
        fallback={formatInitials(name, 'C')}
        size={30}
      />
    ),
  };
}

//===================================================================

export function NewOrderClientSearch({
  pharmacyId,
  value,
  selectedClient,
  onSelect,
  disabled = false,
}: Readonly<{
  pharmacyId: string;
  value: string;
  selectedClient: PharmacyClientRow | null;
  onSelect: (client: PharmacyClientRow | null) => void;
  disabled?: boolean;
}>) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), 250);
  const key = `${pharmacyId}:${debouncedQuery}`;
  const [suggestions, setSuggestions] = useState<SuggestionState | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void getPharmacyClients(
      {
        scope: 'owner',
        pharmacyId,
        status: 'active',
        search: debouncedQuery || undefined,
        page: 1,
        perPage: PAGE_SIZE,
      },
      { signal: controller.signal }
    )
      .then((result) => {
        if (!controller.signal.aborted) {
          setSuggestions({
            key,
            items: result.items,
            page: result.page,
            totalPages: result.totalPages,
            error: false,
          });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setSuggestions({
            key,
            items: [],
            page: 1,
            totalPages: 0,
            error: true,
          });
        }
      });

    return () => controller.abort();
  }, [debouncedQuery, key, pharmacyId]);

  const ready = suggestions?.key === key;

  const options = useMemo(() => {
    const list = (ready ? (suggestions?.items ?? []) : []).map(getOption);

    if (
      !query.trim() &&
      selectedClient &&
      !list.some((option) => option.value === selectedClient.id)
    ) {
      list.unshift(getOption(selectedClient));
    }
    return list;
  }, [query, ready, selectedClient, suggestions]);

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

    void getPharmacyClients({
      scope: 'owner',
      pharmacyId,
      status: 'active',
      search: debouncedQuery || undefined,
      page,
      perPage: PAGE_SIZE,
    })
      .then((result) =>
        setSuggestions((current) =>
          current?.key === key && current.page === page - 1
            ? {
                ...current,
                page,
                totalPages: result.totalPages,
                items: [...current.items, ...result.items],
              }
            : current
        )
      )
      .catch(() => setMoreError('Could not load more clients.'))
      .finally(() => setLoadingMore(false));
  };

  return (
    <SearchableSelect
      id="manager-order-client"
      label="Client"
      labelAccessory={
        <InfoTooltip
          label="About client selection"
          title="Client selection"
          icon={<UsersRound size={20} aria-hidden="true" />}
          items={[
            {
              title: 'Search fields',
              icon: <Search size={17} aria-hidden="true" />,
              description:
                'Find an active client by name, ID, email, phone, or address. The list loads in pages of 50.',
            },
            {
              title: 'Walk-in client',
              icon: <UserRound size={17} aria-hidden="true" />,
              description:
                'The default walk-in client is preselected for this pharmacy when available. Their name includes the pharmacy to distinguish walk-in accounts.',
            },
          ]}
        />
      }
      value={value}
      options={options}
      placeholder="Name, ID, email, phone, or address"
      selectedFallbackLabel={
        selectedClient ? getClientDisplayName(selectedClient) : ''
      }
      emptyMessage={
        ready && suggestions?.error
          ? 'Could not load clients. Try searching again.'
          : 'No active clients found'
      }
      loadingMessage="Loading clients..."
      isOptionsLoading={!ready}
      hasMoreOptions={Boolean(
        ready && suggestions && suggestions.page < suggestions.totalPages
      )}
      onLoadMore={loadMore}
      isLoadingMore={loadingMore}
      loadMoreError={moreError ?? undefined}
      filterOptions={false}
      isActive={Boolean(value)}
      maxLength={80}
      sanitizeQuery={cleanSearch}
      disabled={disabled}
      onQueryChange={(nextQuery) => {
        setQuery(nextQuery);
        setMoreError(null);
      }}
      onChange={(nextValue) => {
        const client =
          (suggestions?.items ?? []).find((item) => item.id === nextValue) ??
          (selectedClient?.id === nextValue ? selectedClient : null);
        onSelect(client);
      }}
    />
  );
}
