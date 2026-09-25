'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';

import type {
  AdminEmployeePrivateNote,
  AdminEmployeePrivateNotesResponse,
} from '@e-pharmacy/types/admin';

import { CountLabel } from '@e-pharmacy/ui/data-display';

import {
  CommentComposer,
  CommentsList,
  useToast,
} from '@e-pharmacy/ui/feedback';

import { PaginationView } from '@e-pharmacy/ui/navigation';
import { ConfirmationModal } from '@e-pharmacy/ui/overlays';
import { Button } from '@e-pharmacy/ui/primitives';

import {
  createMyAdminPrivateComment,
  deleteMyAdminPrivateComment,
  getMyAdminPrivateComments,
} from '@/lib/api/browser/admin-private-comments.api';

import css from './AdminPrivateComments.module.css';

//===================================================================

const ADMIN_PRIVATE_COMMENT_MAX_LENGTH = 1000;

//===================================================================

const EMPTY_COMMENTS: AdminEmployeePrivateNotesResponse = {
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

export function AdminPrivateComments({
  onTotalChange,
}: Readonly<{ onTotalChange?: (total: number) => void }>) {
  const toast = useToast();

  const [data, setData] =
    useState<AdminEmployeePrivateNotesResponse>(EMPTY_COMMENTS);

  const [status, setStatus] = useState<CommentsStatus>('loading');
  const [loadError, setLoadError] = useState('');
  const [draft, setDraftState] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [commentToDelete, setCommentToDelete] =
    useState<AdminEmployeePrivateNote | null>(null);

  const activeLoadControllerRef = useRef<AbortController | null>(null);
  const activeCreateControllerRef = useRef<AbortController | null>(null);
  const activeDeleteControllerRef = useRef<AbortController | null>(null);
  const retryPageRef = useRef(1);

  const createRequestRef = useRef<{
    text: string;
    clientRequestId: string;
  } | null>(null);

  const applyResponse = useCallback(
    (response: AdminEmployeePrivateNotesResponse) => {
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

    void getMyAdminPrivateComments(1, { signal: controller.signal })
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
        const response = await getMyAdminPrivateComments(page, {
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
    setDraftState(value.slice(0, ADMIN_PRIVATE_COMMENT_MAX_LENGTH));
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
      await createMyAdminPrivateComment(request, {
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
      await deleteMyAdminPrivateComment(comment.id, {
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
      aria-labelledby="admin-private-comments-title"
    >
      <div className={css.head}>
        <div className={css.titleRow}>
          <h2 id="admin-private-comments-title">Private comments</h2>

          {status === 'success' ? (
            <CountLabel
              shown={data.items.length}
              total={data.total}
              label="comments"
            />
          ) : null}
        </div>

        <p>
          These notes are visible only to you. Platform Owner access never
          grants access to another employee’s private comments.
        </p>
      </div>

      <CommentComposer
        id="admin-private-comment"
        label="New private comment"
        placeholder="Write a private comment visible only to you..."
        value={draft}
        maxLength={ADMIN_PRIVATE_COMMENT_MAX_LENGTH}
        disabled={status !== 'success' || Boolean(deletingId)}
        isSaving={isSaving}
        onValueChange={setDraft}
        onSubmit={() => void handleCreate()}
      />

      <CommentsList
        items={status === 'success' ? data.items : []}
        title="Saved private comments"
        commentTitle="Private comment"
        emptyText="No private comments yet."
        error={status === 'error' ? loadError : ''}
        isLoading={status === 'loading'}
        deletingId={deletingId}
        deleteDisabled={isSaving}
        onDelete={setCommentToDelete}
      />

      {status === 'error' ? (
        <div className={css.retryRow}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            iconLeft={<RefreshCw size={17} aria-hidden="true" />}
            onClick={() => void loadPage(retryPageRef.current)}
          >
            Retry comments
          </Button>
        </div>
      ) : null}

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
        description="The comment will be permanently removed from your private notes."
        confirmLabel="Delete comment"
        cancelLabel="Keep comment"
        confirmButtonClassName={css.dangerConfirmButton}
        isLoading={Boolean(deletingId)}
        onConfirm={() => void handleDelete()}
        onCancel={() => {
          if (!deletingId) setCommentToDelete(null);
        }}
      />
    </section>
  );
}
