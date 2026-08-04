'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  createCatalogSearchScheduler,
  hasCommittedCatalogSearchChanged,
} from '@/lib/catalog/catalog-search-scheduler';

//===================================================================

export type UseCatalogSearchDraftOptions<TSearch extends object> = Readonly<{
  committed: TSearch;
  delay: number;
  normalize: (draft: TSearch) => TSearch;
  onCommit: (search: TSearch) => void;
}>;

//===================================================================

function serializeSearch(value: object): string {
  return JSON.stringify(value);
}

//===================================================================

export function useCatalogSearchDraft<TSearch extends object>({
  committed,
  delay,
  normalize,
  onCommit,
}: UseCatalogSearchDraftOptions<TSearch>) {
  const committedKey = useMemo(() => serializeSearch(committed), [committed]);
  const [draft, setDraft] = useState<TSearch>(committed);
  const previousCommittedKeyRef = useRef(committedKey);
  const schedulerRef = useRef(createCatalogSearchScheduler<TSearch>());
  const skipNextScheduleRef = useRef(false);

  useEffect(() => {
    if (
      !hasCommittedCatalogSearchChanged(
        previousCommittedKeyRef.current,
        committedKey
      )
    )
      return;

    previousCommittedKeyRef.current = committedKey;
    setDraft(committed);
  }, [committed, committedKey]);

  useEffect(() => {
    if (skipNextScheduleRef.current) {
      skipNextScheduleRef.current = false;
      schedulerRef.current.cancel();
      return;
    }

    const normalized = normalize(draft);
    if (serializeSearch(normalized) === committedKey) return;

    const scheduler = schedulerRef.current;
    scheduler.schedule(normalized, delay, onCommit);

    return () => scheduler.cancel();
  }, [committedKey, delay, draft, normalize, onCommit]);

  const resetDraft = (nextDraft: TSearch) => {
    schedulerRef.current.cancel();
    skipNextScheduleRef.current = true;
    setDraft(nextDraft);
  };

  const isDraftDirty = serializeSearch(draft) !== committedKey;

  return { draft, isDraftDirty, setDraft, resetDraft } as const;
}
