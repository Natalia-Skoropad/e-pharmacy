'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquareLock, Trash2, X } from 'lucide-react';

import type { AdminPharmacyOwnerComment } from '@e-pharmacy/types/admin';
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
  createAdminPharmacyOwnerComment,
  deleteAdminPharmacyOwnerComment,
  getAdminPharmacyOwnerComments,
} from '@/lib/api/browser/admin-pharmacy-owners.api';

import css from './OwnerResourceTabs.module.css';

//===================================================================

const OWNER_COMMENT_MAX_LENGTH = 1000;

type ResourceStatus = 'loading' | 'success' | 'error';

//===================================================================

function createCommentRequestId(): string {
  if (!globalThis.crypto?.randomUUID) {
    throw new Error('Secure comment request IDs are unavailable.');
  }

  return globalThis.crypto.randomUUID();
}

//===================================================================

type OwnerCommentsTabProps = Readonly<{
  ownerId: string;
  canManage: boolean;
  onCountChange?: (count: number) => void;
}>;

//===================================================================

export function OwnerCommentsTab({
  ownerId,
  canManage,
  onCountChange,
}: OwnerCommentsTabProps) {
  const toast = useToast();
  const [comments, setComments] = useState<
    readonly AdminPharmacyOwnerComment[]
  >([]);
  const [loadedOwnerId, setLoadedOwnerId] = useState<string | null>(null);
  const [status, setStatus] = useState<ResourceStatus>('loading');
  const [loadError, setLoadError] = useState('');
  const [draft, setDraftState] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [commentToDelete, setCommentToDelete] =
    useState<AdminPharmacyOwnerComment | null>(null);

  const [reloadVersion, setReloadVersion] = useState(0);

  const createControllerRef = useRef<AbortController | null>(null);
  const deleteControllerRef = useRef<AbortController | null>(null);

  const createRequestRef = useRef<{
    text: string;
    clientRequestId: string;
  } | null>(null);

  const effectiveStatus: ResourceStatus =
    loadedOwnerId === ownerId ? status : 'loading';

  const applyComments = useCallback(
    (nextComments: readonly AdminPharmacyOwnerComment[]) => {
      setComments(nextComments);
      setLoadedOwnerId(ownerId);
      onCountChange?.(nextComments.length);
      setLoadError('');
      setStatus('success');
    },
    [onCountChange, ownerId]
  );

  const loadComments = useCallback(
    async (signal?: AbortSignal) => {
      const response = await getAdminPharmacyOwnerComments(ownerId, { signal });
      applyComments(response.comments);
    },
    [applyComments, ownerId]
  );

  useEffect(() => {
    const controller = new AbortController();

    void getAdminPharmacyOwnerComments(ownerId, { signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return;

        const nextComments = response.comments;
        setComments(nextComments);
        setLoadedOwnerId(ownerId);
        onCountChange?.(nextComments.length);
        setLoadError('');
        setStatus('success');
      })

      .catch(() => {
        if (controller.signal.aborted) return;
        setLoadedOwnerId(ownerId);
        setLoadError('Could not load manager comments. Please try again.');
        setStatus('error');
      });

    return () => {
      controller.abort();
      createControllerRef.current?.abort();
      deleteControllerRef.current?.abort();
    };
  }, [onCountChange, ownerId, reloadVersion]);

  const retryComments = () => {
    setStatus('loading');
    setLoadError('');
    setReloadVersion((value) => value + 1);
  };

  const setDraft = useCallback((value: string) => {
    createRequestRef.current = null;
    setDraftState(value.slice(0, OWNER_COMMENT_MAX_LENGTH));
  }, []);

  const handleCreate = async () => {
    const text = draft.trim();
    if (!canManage || !text || isSaving || deletingId) return;

    const existing = createRequestRef.current;
    const request =
      existing?.text === text
        ? existing
        : { text, clientRequestId: createCommentRequestId() };

    createRequestRef.current = request;
    createControllerRef.current?.abort();

    const controller = new AbortController();
    createControllerRef.current = controller;
    setIsSaving(true);

    try {
      await createAdminPharmacyOwnerComment(ownerId, request, {
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      createRequestRef.current = null;
      setDraftState('');
      await loadComments(controller.signal);
      toast.success('Comment was added.');
    } catch {
      if (!controller.signal.aborted) {
        toast.error('Could not add the comment. Please try again.');
      }
    } finally {
      if (!controller.signal.aborted) setIsSaving(false);
      if (createControllerRef.current === controller) {
        createControllerRef.current = null;
      }
    }
  };

  const handleDelete = async () => {
    const comment = commentToDelete;
    if (!canManage || !comment || deletingId || isSaving) return;

    setCommentToDelete(null);
    setDeletingId(comment.id);
    deleteControllerRef.current?.abort();

    const controller = new AbortController();
    deleteControllerRef.current = controller;

    try {
      await deleteAdminPharmacyOwnerComment(ownerId, comment.id, {
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      await loadComments(controller.signal);
      toast.success('Comment was deleted.');
    } catch {
      if (!controller.signal.aborted) {
        toast.error('Could not delete the comment. Please try again.');
      }
    } finally {
      if (!controller.signal.aborted) setDeletingId(null);
      if (deleteControllerRef.current === controller) {
        deleteControllerRef.current = null;
      }
    }
  };

  return (
    <section
      className={css.resourceCard}
      aria-labelledby="owner-comments-title"
    >
      <ProfileSectionHeader
        title="Comments"
        titleId="owner-comments-title"
        description="Internal Admin comments about this pharmacy owner. The owner cannot see these notes."
        icon={<MessageSquareLock size={22} />}
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
          id="pharmacy-owner-admin-comment"
          label="New comment"
          placeholder="Write an internal comment about this pharmacy owner..."
          value={draft}
          maxLength={OWNER_COMMENT_MAX_LENGTH}
          disabled={effectiveStatus !== 'success' || Boolean(deletingId)}
          isSaving={isSaving}
          onValueChange={setDraft}
          onSubmit={() => void handleCreate()}
        />
      ) : (
        <p className={css.permissionNote}>
          You can review comments, but your current permissions do not allow
          creating or deleting them.
        </p>
      )}

      {effectiveStatus === 'loading' ? (
        <ProfileResourceState
          variant="loading"
          title="Loading comments"
          description="Please wait while internal comments are loaded."
        />
      ) : effectiveStatus === 'error' ? (
        <ProfileResourceState
          variant="error"
          title="Comments could not be loaded"
          description={loadError}
          retryLabel="Retry comments"
          onRetry={retryComments}
        />
      ) : (
        <CommentsList
          items={comments}
          title={null}
          commentTitle="Manager comment"
          emptyTitle="No manager comments yet"
          emptyText="Internal comments created by Admin employees will appear here."
          emptyVariant="profile"
          deletingId={deletingId}
          deleteDisabled={isSaving}
          onDelete={canManage ? setCommentToDelete : undefined}
        />
      )}

      <ConfirmationModal
        isOpen={Boolean(commentToDelete)}
        title="Delete this comment?"
        description="The comment will be permanently removed. The deletion itself remains recorded in Activity history."
        confirmLabel="Delete comment"
        cancelLabel="Keep comment"
        confirmIconLeft={<Trash2 size={17} aria-hidden="true" />}
        cancelIconLeft={<X size={17} aria-hidden="true" />}
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
