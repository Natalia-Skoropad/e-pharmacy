'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquareText, Trash2, X } from 'lucide-react';

import type { AdminPharmacyComment } from '@e-pharmacy/types/admin';
import { CountLabel } from '@e-pharmacy/ui/data-display';

import {
  CommentComposer,
  CommentsList,
  useToast,
} from '@e-pharmacy/ui/feedback';

import { ConfirmationModal } from '@e-pharmacy/ui/overlays';

import {
  ProfileResourceState,
  ProfileSectionHeader,
} from '@e-pharmacy/ui/profile';

import {
  createAdminPharmacyComment,
  deleteAdminPharmacyComment,
  getAdminPharmacyComments,
} from '@/lib/api/browser/admin-pharmacy-detail.api';

import css from './PharmacyResourceTabs.module.css';

//===================================================================

const COMMENT_MAX_LENGTH = 1000;

//===================================================================

type ResourceStatus = 'loading' | 'success' | 'error';

//===================================================================

function createRequestId(): string {
  if (!globalThis.crypto?.randomUUID) {
    throw new Error('Secure comment request IDs are unavailable.');
  }

  return globalThis.crypto.randomUUID();
}

//===================================================================

type PharmacyCommentsTabProps = Readonly<{
  pharmacyId: string;
  canManage: boolean;
  onCountChange?: (count: number) => void;
}>;

//===================================================================

/** Private pharmacy-scoped Admin notes; never Owner/Pharmacy cabinet notes. */
export function PharmacyCommentsTab({
  pharmacyId,
  canManage,
  onCountChange,
}: PharmacyCommentsTabProps) {
  const toast = useToast();
  const [comments, setComments] = useState<readonly AdminPharmacyComment[]>([]);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [status, setStatus] = useState<ResourceStatus>('loading');
  const [loadError, setLoadError] = useState('');
  const [draft, setDraftState] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [commentToDelete, setCommentToDelete] =
    useState<AdminPharmacyComment | null>(null);

  const [reloadVersion, setReloadVersion] = useState(0);
  const createControllerRef = useRef<AbortController | null>(null);
  const deleteControllerRef = useRef<AbortController | null>(null);

  const requestRef = useRef<{ text: string; clientRequestId: string } | null>(
    null
  );

  const effectiveStatus = loadedId === pharmacyId ? status : 'loading';

  useEffect(() => {
    if (effectiveStatus === 'success') onCountChange?.(comments.length);
  }, [comments.length, effectiveStatus, onCountChange]);

  const applyComments = useCallback(
    (next: readonly AdminPharmacyComment[]) => {
      setComments(next);
      setLoadedId(pharmacyId);
      setLoadError('');
      setStatus('success');
    },
    [pharmacyId]
  );

  const reloadComments = useCallback(
    async (signal?: AbortSignal) => {
      const response = await getAdminPharmacyComments(pharmacyId, { signal });

      if (!signal?.aborted) applyComments(response.comments);
    },

    [applyComments, pharmacyId]
  );

  useEffect(() => {
    const controller = new AbortController();

    void getAdminPharmacyComments(pharmacyId, { signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return;

        applyComments(response.comments);
      })

      .catch(() => {
        if (controller.signal.aborted) return;

        setLoadedId(pharmacyId);
        setStatus('error');

        setLoadError(
          'Could not load internal pharmacy comments. Please retry.'
        );
      });

    return () => controller.abort();
  }, [pharmacyId, applyComments, reloadVersion]);

  useEffect(
    () => () => {
      createControllerRef.current?.abort();
      deleteControllerRef.current?.abort();
    },
    [pharmacyId]
  );

  const retry = () => {
    setStatus('loading');
    setReloadVersion((version) => version + 1);
  };

  const setDraft = (next: string) => {
    requestRef.current = null;
    setDraftState(next.slice(0, COMMENT_MAX_LENGTH));
  };

  const handleCreate = async () => {
    const text = draft.trim();

    if (
      !canManage ||
      !text ||
      isSaving ||
      deletingId ||
      effectiveStatus !== 'success'
    )
      return;

    const existing = requestRef.current;

    const request =
      existing?.text === text
        ? existing
        : { text, clientRequestId: createRequestId() };

    requestRef.current = request;

    const controller = new AbortController();

    createControllerRef.current = controller;
    setIsSaving(true);

    try {
      const created = await createAdminPharmacyComment(pharmacyId, request, {
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      // Reflect the committed mutation even if the follow-up list request fails.
      setComments((current) => [
        created.comment,
        ...current.filter((item) => item.id !== created.comment.id),
      ]);

      setDraftState('');
      requestRef.current = null;
      toast.success('Comment was added.');

      try {
        await reloadComments(controller.signal); // Invalidate only this pharmacy's Comments tab.
      } catch {
        if (!controller.signal.aborted)
          toast.error('Comment added, but the list could not refresh.');
      }
    } catch {
      if (!controller.signal.aborted)
        toast.error('Could not add the comment. Please try again.');
    } finally {
      if (!controller.signal.aborted) setIsSaving(false);

      if (createControllerRef.current === controller)
        createControllerRef.current = null;
    }
  };

  const handleDelete = async () => {
    const comment = commentToDelete;

    if (!canManage || !comment || isSaving || deletingId) return;

    setCommentToDelete(null);
    setDeletingId(comment.id);

    const controller = new AbortController();

    deleteControllerRef.current = controller;

    try {
      await deleteAdminPharmacyComment(pharmacyId, comment.id, {
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      setComments((current) =>
        current.filter((item) => item.id !== comment.id)
      );

      toast.success('Comment was deleted.');

      try {
        await reloadComments(controller.signal); // Do not invalidate Documents or Pharmacy Detail.
      } catch {
        if (!controller.signal.aborted)
          toast.error('Comment deleted, but the list could not refresh.');
      }
    } catch {
      if (!controller.signal.aborted)
        toast.error('Could not delete the comment. Please try again.');
    } finally {
      if (!controller.signal.aborted) setDeletingId(null);

      if (deleteControllerRef.current === controller)
        deleteControllerRef.current = null;
    }
  };

  return (
    <section
      className={css.resourceCard}
      aria-labelledby="pharmacy-admin-comments-title"
    >
      <ProfileSectionHeader
        title="Comments"
        titleId="pharmacy-admin-comments-title"
        description="Private working comments about this pharmacy. Pharmacy owners and staff cannot see them."
        icon={<MessageSquareText size={22} />}
        action={
          effectiveStatus === 'success' ? (
            <CountLabel
              shown={comments.length}
              total={comments.length}
              label="comments"
              fullWidthOnMobile
            />
          ) : null
        }
      />

      {canManage ? (
        <CommentComposer
          id="pharmacy-admin-comment"
          label="New comment"
          placeholder="Write an internal comment about this pharmacy..."
          value={draft}
          maxLength={COMMENT_MAX_LENGTH}
          disabled={effectiveStatus !== 'success' || Boolean(deletingId)}
          isSaving={isSaving}
          onValueChange={setDraft}
          onSubmit={() => void handleCreate()}
        />
      ) : (
        <p className={css.permissionNote}>
          You can read internal comments, but your permissions do not allow
          creating or deleting them.
        </p>
      )}

      {effectiveStatus === 'loading' ? (
        <ProfileResourceState
          variant="loading"
          title="Loading comments"
          description="Loading private pharmacy notes."
        />
      ) : effectiveStatus === 'error' ? (
        <ProfileResourceState
          variant="error"
          title="Comments could not be loaded"
          description={loadError}
          retryLabel="Retry comments"
          onRetry={retry}
        />
      ) : (
        <CommentsList
          items={comments}
          title={null}
          commentTitle="Admin comment"
          emptyTitle="No internal comments yet"
          emptyText="Admin employee comments about this pharmacy will appear here."
          emptyVariant="resource"
          deletingId={deletingId}
          deleteDisabled={isSaving}
          onDelete={canManage ? setCommentToDelete : undefined}
        />
      )}

      <ConfirmationModal
        isOpen={Boolean(commentToDelete)}
        title="Delete this comment?"
        eyebrow="Comments"
        description="The comment will be permanently removed; the deletion remains in the Admin audit history."
        confirmLabel="Delete comment"
        cancelLabel="Keep comment"
        confirmIconLeft={<Trash2 size={17} aria-hidden="true" />}
        cancelIconLeft={<X size={17} aria-hidden="true" />}
        destructive
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
