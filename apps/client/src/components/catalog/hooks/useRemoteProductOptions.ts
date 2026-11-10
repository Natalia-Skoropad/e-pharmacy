'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  CatalogProductsQueryParams,
  ProductCardSummary,
} from '@e-pharmacy/types/products';

import { getProducts } from '@/lib/api/browser';

//===================================================================

const PAGE_SIZE = 50;
const DEBOUNCE_MS = 300;

//===================================================================

/** Public catalog search is scoped to the product name or article by the API. */
export function useRemoteProductOptions(
  relationships: Pick<
    CatalogProductsQueryParams,
    'category' | 'pharmacyId'
  > = {}
) {
  const { category, pharmacyId } = relationships;
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<readonly ProductCardSummary[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isOptionsLoading, setIsOptionsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const generation = useRef(0);
  const loadingMore = useRef(false);
  const activeController = useRef<AbortController | null>(null);

  useEffect(() => {
    const token = ++generation.current;

    activeController.current?.abort();

    const controller = new AbortController();

    activeController.current = controller;

    const resetTimer = setTimeout(() => {
      if (token !== generation.current) return;

      setItems([]);
      setPage(0);
      setHasMore(false);
      setError('');
      setIsOptionsLoading(isOpen);
      setIsLoadingMore(false);
    }, 0);

    const requestTimer = isOpen
      ? setTimeout(
          async () => {
            try {
              const response = await getProducts(
                {
                  catalogSearch: query.trim() || undefined,
                  category,
                  pharmacyId,
                  page: 1,
                  perPage: PAGE_SIZE,
                },
                { signal: controller.signal }
              );

              if (token !== generation.current || controller.signal.aborted)
                return;

              setItems(response.items);
              setPage(1);
              setHasMore(response.totalPages > 1);
            } catch {
              if (token === generation.current && !controller.signal.aborted)
                setError('Could not load products. Try again.');
            } finally {
              if (token === generation.current && !controller.signal.aborted)
                setIsOptionsLoading(false);
            }
          },
          query.trim() ? DEBOUNCE_MS : 0
        )
      : null;

    return () => {
      clearTimeout(resetTimer);

      if (requestTimer !== null) clearTimeout(requestTimer);

      controller.abort();
      generation.current = token + 1;
    };
  }, [isOpen, query, category, pharmacyId, retry]);

  const loadMore = useCallback(async () => {
    if (!isOpen || loadingMore.current || isOptionsLoading) return;

    if (page === 0) {
      setRetry((current) => current + 1);
      return;
    }

    if (!hasMore) return;

    loadingMore.current = true;

    const token = generation.current;
    const controller = new AbortController();

    activeController.current = controller;
    setError('');
    setIsLoadingMore(true);

    try {
      const nextPage = page + 1;

      const response = await getProducts(
        {
          catalogSearch: query.trim() || undefined,
          category,
          pharmacyId,
          page: nextPage,
          perPage: PAGE_SIZE,
        },
        { signal: controller.signal }
      );

      if (token !== generation.current || controller.signal.aborted) return;

      setItems((existing) => {
        const ids = new Set(existing.map((product) => product.id));

        return [
          ...existing,
          ...response.items.filter((product) => !ids.has(product.id)),
        ];
      });

      setPage(nextPage);
      setHasMore(nextPage < response.totalPages);
    } catch {
      if (token === generation.current && !controller.signal.aborted)
        setError('Could not load more products.');
    } finally {
      if (token === generation.current) {
        loadingMore.current = false;
        setIsLoadingMore(false);
      }
    }
  }, [hasMore, isOpen, isOptionsLoading, page, query, category, pharmacyId]);

  return {
    items,
    query,
    setQuery,
    setIsOpen,
    isOptionsLoading,
    hasMore,
    isLoadingMore,
    error,
    loadMore,
  } as const;
}
