'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  PharmacyNote,
  PharmacyNotesResponse,
} from '@e-pharmacy/types/notes';

import { getSafeApiErrorMessage } from '@/lib/errors/get-safe-api-error-message';

//===================================================================

export type EntityCommentsResourceStatus = 'loading' | 'success' | 'error';

//===================================================================

export type EntityCommentsCreateOptions = Readonly<{
  signal?: AbortSignal;
  clientRequestId: string;
}>;

export type EntityCommentsRemoveOptions = Readonly<{
  signal?: AbortSignal;
}>;

//===================================================================

export type EntityCommentsMutationResult =
  | { status: 'success' }
  | { status: 'error'; error: unknown }
  | { status: 'aborted' };

//===================================================================

type UseEntityCommentsResourceOptions = Readonly<{
  initialTotal?: number;
  isEditable: boolean;

  load: (
    page: number,
    options?: Readonly<{ signal?: AbortSignal }>
  ) => Promise<PharmacyNotesResponse>;

  create: (text: string, options: EntityCommentsCreateOptions) => Promise<void>;
  remove: (id: string, options?: EntityCommentsRemoveOptions) => Promise<void>;
  onTotalChange?: (total: number) => void;
}>;

//===================================================================

function createCommentRequestId(): string {
  if (!globalThis.crypto?.randomUUID) {
    throw new Error('Secure comment request IDs are unavailable.');
  }

  return globalThis.crypto.randomUUID();
}

//===================================================================

export function useEntityCommentsResource({
  initialTotal,
  isEditable,
  load,
  create,
  remove,
  onTotalChange,
}: UseEntityCommentsResourceOptions) {
  const loadRef = useRef(load);
  const createRef = useRef(create);
  const removeRef = useRef(remove);
  const onTotalChangeRef = useRef(onTotalChange);

  const activeLoadControllerRef = useRef<AbortController | null>(null);
  const activeCreateControllerRef = useRef<AbortController | null>(null);
  const activeDeleteControllerRef = useRef<AbortController | null>(null);
  const retryPageRef = useRef(1);

  const createRequestRef = useRef<{
    text: string;
    clientRequestId: string;
  } | null>(null);

  const [data, setData] = useState<PharmacyNotesResponse>({
    items: [],
    page: 1,
    perPage: 10,
    total: initialTotal ?? 0,
    totalPages: 1,
  });

  const [draft, setDraftState] = useState('');
  const [status, setStatus] = useState<EntityCommentsResourceStatus>('loading');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [commentToDelete, setCommentToDelete] = useState<PharmacyNote | null>(
    null
  );

  const [error, setError] = useState('');

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    createRef.current = create;
  }, [create]);

  useEffect(() => {
    removeRef.current = remove;
  }, [remove]);

  useEffect(() => {
    onTotalChangeRef.current = onTotalChange;
  }, [onTotalChange]);

  const applyResponse = useCallback((response: PharmacyNotesResponse) => {
    setData(response);
    onTotalChangeRef.current?.(response.total);
    setStatus('success');
  }, []);

  const loadPage = useCallback(
    async (page: number): Promise<EntityCommentsMutationResult> => {
      retryPageRef.current = page;
      activeLoadControllerRef.current?.abort();

      const controller = new AbortController();
      activeLoadControllerRef.current = controller;

      setStatus('loading');
      setError('');

      try {
        const response = await loadRef.current(page, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) return { status: 'aborted' };

        applyResponse(response);
        return { status: 'success' };
      } catch (loadError) {
        if (controller.signal.aborted) return { status: 'aborted' };

        setError(
          getSafeApiErrorMessage(
            loadError,
            'Could not load comments. Please try again.'
          )
        );
        setStatus('error');
        return { status: 'error', error: loadError };
      } finally {
        if (activeLoadControllerRef.current === controller) {
          activeLoadControllerRef.current = null;
        }
      }
    },
    [applyResponse]
  );

  useEffect(() => {
    const controller = new AbortController();
    activeLoadControllerRef.current = controller;

    void loadRef
      .current(1, { signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return;
        applyResponse(response);
      })
      .catch((loadError: unknown) => {
        if (controller.signal.aborted) return;

        setError(
          getSafeApiErrorMessage(
            loadError,
            'Could not load comments. Please try again.'
          )
        );
        setStatus('error');
      })
      .finally(() => {
        if (activeLoadControllerRef.current === controller) {
          activeLoadControllerRef.current = null;
        }
      });

    return () => {
      controller.abort();
      activeLoadControllerRef.current?.abort();
      activeCreateControllerRef.current?.abort();
      activeDeleteControllerRef.current?.abort();
      activeLoadControllerRef.current = null;
      activeCreateControllerRef.current = null;
      activeDeleteControllerRef.current = null;
    };
  }, [applyResponse]);

  const setDraft = useCallback((value: string) => {
    createRequestRef.current = null;
    setDraftState(value);
  }, []);

  const submitDraft =
    useCallback(async (): Promise<EntityCommentsMutationResult> => {
      const text = draft.trim();
      if (!text || isSaving || deletingId || !isEditable) {
        return { status: 'aborted' };
      }

      const existingRequest = createRequestRef.current;
      const request =
        existingRequest?.text === text
          ? existingRequest
          : { text, clientRequestId: createCommentRequestId() };

      createRequestRef.current = request;
      activeCreateControllerRef.current?.abort();
      const controller = new AbortController();
      activeCreateControllerRef.current = controller;
      setIsSaving(true);

      try {
        await createRef.current(text, {
          signal: controller.signal,
          clientRequestId: request.clientRequestId,
        });

        if (controller.signal.aborted) return { status: 'aborted' };

        createRequestRef.current = null;
        setDraftState('');
        await loadPage(1);
        return { status: 'success' };
      } catch (createError) {
        if (controller.signal.aborted) return { status: 'aborted' };
        return { status: 'error', error: createError };
      } finally {
        if (!controller.signal.aborted) setIsSaving(false);
        if (activeCreateControllerRef.current === controller) {
          activeCreateControllerRef.current = null;
        }
      }
    }, [deletingId, draft, isEditable, isSaving, loadPage]);

  const requestDelete = useCallback((comment: PharmacyNote) => {
    setCommentToDelete(comment);
  }, []);

  const cancelDelete = useCallback(() => {
    if (!deletingId) setCommentToDelete(null);
  }, [deletingId]);

  const confirmDelete =
    useCallback(async (): Promise<EntityCommentsMutationResult> => {
      const comment = commentToDelete;
      if (!comment || deletingId || isSaving || !isEditable) {
        return { status: 'aborted' };
      }

      setCommentToDelete(null);
      setDeletingId(comment.id);
      activeDeleteControllerRef.current?.abort();
      const controller = new AbortController();
      activeDeleteControllerRef.current = controller;

      try {
        await removeRef.current(comment.id, { signal: controller.signal });
        if (controller.signal.aborted) return { status: 'aborted' };

        const nextPage =
          data.items.length === 1 && data.page > 1 ? data.page - 1 : data.page;
        await loadPage(nextPage);
        return { status: 'success' };
      } catch (deleteError) {
        if (controller.signal.aborted) return { status: 'aborted' };
        return { status: 'error', error: deleteError };
      } finally {
        if (!controller.signal.aborted) setDeletingId(null);
        if (activeDeleteControllerRef.current === controller) {
          activeDeleteControllerRef.current = null;
        }
      }
    }, [
      commentToDelete,
      data.items.length,
      data.page,
      deletingId,
      isEditable,
      isSaving,
      loadPage,
    ]);

  const retry = useCallback(() => loadPage(retryPageRef.current), [loadPage]);

  return {
    data,
    draft,
    status,
    isSaving,
    deletingId,
    commentToDelete,
    error,
    setDraft,
    loadPage,
    retry,
    submitDraft,
    requestDelete,
    cancelDelete,
    confirmDelete,
  };
}
