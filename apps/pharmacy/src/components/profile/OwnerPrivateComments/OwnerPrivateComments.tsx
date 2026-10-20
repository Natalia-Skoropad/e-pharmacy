'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquareLock, Trash2, X } from 'lucide-react';

import type {
  PharmacyUserPrivateNote,
  PharmacyUserPrivateNotesResponse,
} from '@e-pharmacy/types/pharmacy-owners';

import { CountLabel } from '@e-pharmacy/ui/data-display';

import {
  CommentComposer,
  CommentsList,
  useToast,
} from '@e-pharmacy/ui/feedback';

import { PaginationView } from '@e-pharmacy/ui/navigation';

import {
  ProfileResourceState,
  ProfileSectionHeader,
} from '@e-pharmacy/ui/profile';

import { ConfirmationModal } from '@e-pharmacy/ui/overlays';

import {
  createMyPharmacyUserPrivateComment,
  deleteMyPharmacyUserPrivateComment,
  getMyPharmacyUserPrivateComments,
} from '@/lib/api/browser/pharmacy-user-private-comments.api';

import css from './OwnerPrivateComments.module.css';

//===================================================================

const OWNER_PRIVATE_COMMENT_MAX_LENGTH = 1000;

//===================================================================

const EMPTY_COMMENTS: PharmacyUserPrivateNotesResponse = {
  items: [],
  page: 1,
  perPage: 10,
  total: 0,
  totalPages: 0,
};

//===================================================================

type CommentsStatus = 'loading' | 'success' | 'error';

//===================================================================

function createCommentRequestId(): string {
  if (!globalThis.crypto?.randomUUID) {
    throw new Error('Secure comment request IDs are unavailable.');
  }

  return globalThis.crypto.randomUUID();
}

//===================================================================

export function OwnerPrivateComments({
  onTotalChange,
}: Readonly<{ onTotalChange?: (total: number) => void }>) {
  const toast = useToast();

  const [data, setData] =
    useState<PharmacyUserPrivateNotesResponse>(EMPTY_COMMENTS);

  const [status, setStatus] = useState<CommentsStatus>('loading');
  const [loadError, setLoadError] = useState('');
  const [draft, setDraftState] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [commentToDelete, setCommentToDelete] =
    useState<PharmacyUserPrivateNote | null>(null);

  const activeLoadControllerRef = useRef<AbortController | null>(null);
  const activeCreateControllerRef = useRef<AbortController | null>(null);
  const activeDeleteControllerRef = useRef<AbortController | null>(null);
  const retryPageRef = useRef(1);

  const createRequestRef = useRef<{
    text: string;
    clientRequestId: string;
  } | null>(null);

  const applyResponse = useCallback(
    (response: PharmacyUserPrivateNotesResponse) => {
      setData(response);
      onTotalChange?.(response.total);
      setLoadError('');
      setStatus('success');
    },

    [onTotalChange]
  );

  useEffect(() => {
    const controller = new AbortController();

    activeLoadControllerRef.current = controller;

    void getMyPharmacyUserPrivateComments(1, { signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return;

        applyResponse(response);
      })

      .catch(() => {
        if (controller.signal.aborted) return;

        setLoadError('Could not load private comments. Please try again.');
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

  const loadPage = useCallback(
    async (page: number): Promise<boolean> => {
      retryPageRef.current = page;
      activeLoadControllerRef.current?.abort();

      const controller = new AbortController();

      activeLoadControllerRef.current = controller;
      setStatus('loading');
      setLoadError('');

      try {
        const response = await getMyPharmacyUserPrivateComments(page, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) return false;

        applyResponse(response);
        return true;
      } catch {
        if (controller.signal.aborted) return false;

        setLoadError('Could not load private comments. Please try again.');
        setStatus('error');

        return false;
      } finally {
        if (activeLoadControllerRef.current === controller) {
          activeLoadControllerRef.current = null;
        }
      }
    },
    [applyResponse]
  );

  const setDraft = useCallback((value: string) => {
    createRequestRef.current = null;
    setDraftState(value.slice(0, OWNER_PRIVATE_COMMENT_MAX_LENGTH));
  }, []);

  const handleCreate = async () => {
    const text = draft.trim();

    if (!text || isSaving || deletingId) return;

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
      await createMyPharmacyUserPrivateComment(request, {
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      createRequestRef.current = null;
      setDraftState('');

      await loadPage(1);

      toast.success('Private comment was added.');
    } catch {
      if (!controller.signal.aborted) {
        toast.error('Could not add the private comment. Please try again.');
      }
    } finally {
      if (!controller.signal.aborted) setIsSaving(false);

      if (activeCreateControllerRef.current === controller) {
        activeCreateControllerRef.current = null;
      }
    }
  };

  const handleDelete = async () => {
    const comment = commentToDelete;

    if (!comment || deletingId || isSaving) return;

    setCommentToDelete(null);
    setDeletingId(comment.id);
    activeDeleteControllerRef.current?.abort();

    const controller = new AbortController();

    activeDeleteControllerRef.current = controller;

    try {
      await deleteMyPharmacyUserPrivateComment(comment.id, {
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      const nextPage =
        data.items.length === 1 && data.page > 1 ? data.page - 1 : data.page;

      await loadPage(nextPage);

      toast.success('Private comment was deleted.');
    } catch {
      if (!controller.signal.aborted) {
        toast.error('Could not delete the private comment. Please try again.');
      }
    } finally {
      if (!controller.signal.aborted) setDeletingId(null);

      if (activeDeleteControllerRef.current === controller) {
        activeDeleteControllerRef.current = null;
      }
    }
  };

  return (
    <section
      className={css.card}
      aria-labelledby="owner-private-comments-title"
    >
      <ProfileSectionHeader
        title="Private comments"
        titleId="owner-private-comments-title"
        description="These notes are visible only to you."
        icon={<MessageSquareLock size={22} />}
        action={
          status === 'success' ? (
            <CountLabel
              shown={data.items.length}
              total={data.total}
              label="comments"
              fullWidthOnMobile
            />
          ) : null
        }
      />

      <CommentComposer
        id="owner-private-comment"
        label="New private comment"
        placeholder="Write a private comment visible only to you..."
        value={draft}
        maxLength={OWNER_PRIVATE_COMMENT_MAX_LENGTH}
        disabled={status !== 'success' || Boolean(deletingId)}
        isSaving={isSaving}
        onValueChange={setDraft}
        onSubmit={() => void handleCreate()}
      />

      {status === 'loading' ? (
        <ProfileResourceState
          variant="loading"
          title="Loading comments"
          description="Please wait while your private comments are loaded."
        />
      ) : status === 'error' ? (
        <ProfileResourceState
          variant="error"
          title="Comments could not be loaded"
          description={loadError}
          retryLabel="Retry comments"
          onRetry={() => loadPage(retryPageRef.current)}
        />
      ) : (
        <CommentsList
          items={data.items}
          title={null}
          commentTitle="Private comment"
          emptyTitle="No private comments yet."
          emptyText="Only you can read the notes you add here."
          emptyVariant="resource"
          deletingId={deletingId}
          deleteDisabled={isSaving}
          onDelete={setCommentToDelete}
        />
      )}

      {status === 'success' ? (
        <PaginationView
          currentPage={data.page}
          totalPages={data.totalPages}
          ariaLabel="Private comments pagination"
          onPageChange={(page) => void loadPage(page)}
        />
      ) : null}

      <ConfirmationModal
        isOpen={Boolean(commentToDelete)}
        title="Delete this private comment?"
        eyebrow="Private comments"
        description="The comment will be permanently removed from your private notes."
        confirmLabel="Delete comment"
        cancelLabel="Keep comment"
        destructive
        confirmButtonClassName={css.dangerConfirmButton}
        confirmIconLeft={<Trash2 size={17} aria-hidden="true" />}
        cancelIconLeft={<X size={17} aria-hidden="true" />}
        isLoading={Boolean(deletingId)}
        onConfirm={() => void handleDelete()}
        onCancel={() => {
          if (!deletingId) setCommentToDelete(null);
        }}
      />
    </section>
  );
}
