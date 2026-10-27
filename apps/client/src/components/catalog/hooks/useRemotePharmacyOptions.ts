'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  PharmacyLocationFilterOption,
  PharmacyOption,
  PharmacySearchOptionsParams,
} from '@e-pharmacy/types/pharmacies';

import { getPharmacySearchOptions } from '@/lib/api/browser';

import {
  PHARMACY_SELECT_PAGE_SIZE,
  pharmacyOptionsPageCache,
} from './pharmacyOptionsPageCache';

//===================================================================

const QUERY_DEBOUNCE_MS = 300;

//===================================================================

type Relationships = Readonly<
  Pick<PharmacySearchOptionsParams, 'pharmacyId' | 'settlement' | 'region'>
>;

//===================================================================

function makePageParams(
  kind: 'pharmacy' | 'location',
  query: string,
  page: number,
  relationships: Relationships,
  perPage: number
): PharmacySearchOptionsParams {
  return {
    kind,
    query: query.trim(),
    page,
    perPage,

    ...(kind === 'location' && relationships.pharmacyId
      ? { pharmacyId: relationships.pharmacyId }
      : {}),

    ...(kind === 'pharmacy' && relationships.settlement
      ? { settlement: relationships.settlement }
      : {}),

    ...(kind === 'pharmacy' && relationships.region
      ? { region: relationships.region }
      : {}),
  };
}

//===================================================================

// Remove duplicates if the live catalog changes between offset-based pages.
function mergeUniqueOptions<
  TItem extends PharmacyOption | PharmacyLocationFilterOption,
>(current: readonly TItem[], next: readonly TItem[]): readonly TItem[] {
  const key = (item: TItem) =>
    'id' in item
      ? item.id
      : `${item.settlement.toLocaleLowerCase()}|${(item.region ?? '').toLocaleLowerCase()}`;

  const seen = new Set(current.map(key));

  return [
    ...current,

    ...next.filter((item) => {
      const id = key(item);

      if (seen.has(id)) return false;

      seen.add(id);

      return true;
    }),
  ];
}

//===================================================================

// Remote paging is opt-in for the shared SearchableSelect. Both the active
// network request and its generation are invalidated on query/filter changes.
export function useRemotePharmacyOptions<TKind extends 'pharmacy' | 'location'>(
  kind: TKind,
  relationships: Relationships = {},
  requestedPageSize = PHARMACY_SELECT_PAGE_SIZE
) {
  type Item = TKind extends 'pharmacy'
    ? PharmacyOption
    : PharmacyLocationFilterOption;

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<readonly Item[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isOptionsLoading, setIsOptionsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  const generation = useRef(0);
  const pending = useRef(false);
  const pageController = useRef<AbortController | null>(null);
  const { pharmacyId, settlement, region } = relationships;

  const perPage = Number.isFinite(requestedPageSize)
    ? Math.max(
        1,
        Math.min(PHARMACY_SELECT_PAGE_SIZE, Math.floor(requestedPageSize))
      )
    : PHARMACY_SELECT_PAGE_SIZE;

  useEffect(() => {
    const token = ++generation.current;

    pageController.current?.abort();
    pageController.current = null;
    pending.current = false;

    // State derived from a new remote request is updated asynchronously;
    // the effect itself only synchronizes/cancels external network work.
    if (!isOpen) {
      const closeTimer = setTimeout(() => {
        if (generation.current !== token) return;

        setIsOptionsLoading(false);
        setIsLoadingMore(false);
      }, 0);

      return () => {
        clearTimeout(closeTimer);
        generation.current = token + 1;
      };
    }

    const params = makePageParams(
      kind,
      query,
      1,
      { pharmacyId, settlement, region },
      perPage
    );

    const cached = pharmacyOptionsPageCache.get(params);
    const controller = new AbortController();

    const resetTimer = setTimeout(() => {
      if (generation.current !== token) return;

      setPage(cached ? 1 : 0);
      setItems(cached ? (cached.items as readonly Item[]) : []);
      setHasMore(Boolean(cached && cached.totalPages > 1));
      setError('');
      setIsLoadingMore(false);
      setIsOptionsLoading(!cached);
    }, 0);

    const fetchTimer = cached
      ? null
      : setTimeout(
          async () => {
            try {
              const response = await getPharmacySearchOptions(params, {
                signal: controller.signal,
              });

              if (generation.current !== token || controller.signal.aborted)
                return;

              pharmacyOptionsPageCache.set(params, response);
              setItems(response.items as readonly Item[]);
              setPage(1);
              setHasMore(response.totalPages > 1);
            } catch {
              if (generation.current === token && !controller.signal.aborted)
                setError('Could not load options');
            } finally {
              if (generation.current === token && !controller.signal.aborted)
                setIsOptionsLoading(false);
            }
          },
          query.trim() ? QUERY_DEBOUNCE_MS : 0
        );

    return () => {
      clearTimeout(resetTimer);

      if (fetchTimer !== null) clearTimeout(fetchTimer);

      controller.abort();
      pageController.current?.abort();
      pageController.current = null;
      generation.current = token + 1;
    };
  }, [isOpen, query, kind, pharmacyId, settlement, region, perPage, retryKey]);

  const loadMore = useCallback(async () => {
    if (!isOpen || pending.current || isOptionsLoading) return;

    if (page === 0) {
      // Retry the initial page after a failed request.
      setRetryKey((current) => current + 1);
      return;
    }

    if (!hasMore) return;

    pending.current = true;

    const token = generation.current;
    const controller = new AbortController();

    pageController.current = controller;

    const nextPage = page + 1;

    const params = makePageParams(
      kind,
      query,
      nextPage,
      { pharmacyId, settlement, region },
      perPage
    );

    setError('');
    setIsLoadingMore(true);

    try {
      const cached = pharmacyOptionsPageCache.get(params);

      const response =
        cached ??
        (await getPharmacySearchOptions(params, { signal: controller.signal }));

      if (token !== generation.current || controller.signal.aborted) return;
      if (!cached) pharmacyOptionsPageCache.set(params, response);

      setItems((current) =>
        mergeUniqueOptions(current, response.items as readonly Item[])
      );

      setPage(nextPage);
      setHasMore(nextPage < response.totalPages);
    } catch {
      if (token === generation.current && !controller.signal.aborted)
        setError('Could not load more');
    } finally {
      if (token === generation.current) {
        pending.current = false;
        pageController.current = null;
        setIsLoadingMore(false);
      }
    }
  }, [
    hasMore,
    isOpen,
    isOptionsLoading,
    kind,
    page,
    pharmacyId,
    query,
    region,
    settlement,
    perPage,
  ]);

  return {
    items,
    isOpen,
    query,
    isOptionsLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    setIsOpen,
    setQuery,
  };
}
