'use client';

import { useId } from 'react';
import { MessageSquareText, RefreshCw, Trash2, X } from 'lucide-react';

import type { PharmacyNotesResponse } from '@e-pharmacy/types/notes';
import { PHARMACY_NOTE_MAX_LENGTH } from '@e-pharmacy/validation/pharmacy';
import { CountLabel } from '@e-pharmacy/ui/data-display';
import { Button } from '@e-pharmacy/ui/primitives';

import {
  CommentsList,
  CommentComposer,
  useToast,
} from '@e-pharmacy/ui/feedback';

import { PaginationView } from '@e-pharmacy/ui/navigation';

import {
  ProfileResourceState,
  ProfileSectionHeader,
} from '@e-pharmacy/ui/profile';

import { ConfirmationModal } from '@e-pharmacy/ui/overlays';

import { getSafeApiErrorMessage } from '@/lib/errors/get-safe-api-error-message';

import {
  type EntityCommentsCreateOptions,
  type EntityCommentsRemoveOptions,
  useEntityCommentsResource,
} from './useEntityCommentsResource';

import css from './EntityComments.module.css';

//===================================================================

export type EntityCommentsProps = Readonly<{
  entityKey: string;
  title?: string;
  description?: string;
  commentTitle?: string;
  placeholder?: string;
  emptyTitle?: string;
  emptyText?: string;
  presentation?: 'default' | 'profile';
  initialTotal?: number;
  initialData?: PharmacyNotesResponse;
  isEditable?: boolean;

  load: (
    page: number,
    options?: Readonly<{ signal?: AbortSignal }>
  ) => Promise<PharmacyNotesResponse>;

  create: (text: string, options: EntityCommentsCreateOptions) => Promise<void>;
  remove: (id: string, options?: EntityCommentsRemoveOptions) => Promise<void>;
  onTotalChange?: (total: number) => void;
}>;

//===================================================================

export function EntityComments(props: EntityCommentsProps) {
  return <EntityCommentsContent key={props.entityKey} {...props} />;
}

//===================================================================

function EntityCommentsContent({
  entityKey,
  title = 'Comments',
  description,
  commentTitle = 'Comment',
  placeholder = 'Write an internal comment...',
  emptyTitle,
  emptyText = 'No manager comments yet. The comment drawer is waiting patiently.',
  presentation = 'default',
  initialTotal,
  initialData,
  isEditable = true,
  load,
  create,
  remove,
  onTotalChange,
}: EntityCommentsProps) {
  const toast = useToast();
  const generatedId = useId();
  const titleId = `${entityKey}-${generatedId}-comments-title`;
  const isProfilePresentation = presentation === 'profile';

  const comments = useEntityCommentsResource({
    initialTotal,
    initialData,
    isEditable,
    load,
    create,
    remove,
    onTotalChange,
  });

  const handleCreate = async () => {
    const result = await comments.submitDraft();
    if (result.status === 'success') {
      toast.success('Comment added successfully.');
    } else if (result.status === 'error') {
      toast.error(
        getSafeApiErrorMessage(
          result.error,
          'Could not add the comment. Please try again.'
        )
      );
    }
  };

  const handleDelete = async () => {
    const result = await comments.confirmDelete();
    if (result.status === 'success') {
      toast.success('Comment deleted successfully.');
    } else if (result.status === 'error') {
      toast.error(
        getSafeApiErrorMessage(
          result.error,
          'Could not delete the comment. Please try again.'
        )
      );
    }
  };

  return (
    <section className={css.card} aria-labelledby={titleId}>
      {isProfilePresentation ? (
        <ProfileSectionHeader
          title={title}
          titleId={titleId}
          description={description}
          icon={<MessageSquareText size={22} />}
          action={
            comments.status === 'success' ? (
              <CountLabel
                shown={comments.data.items.length}
                total={comments.data.total}
                label="comments"
                fullWidthOnMobile
              />
            ) : null
          }
        />
      ) : (
        <div className={css.head}>
          <h2 id={titleId}>{title}</h2>
          {comments.status === 'success' ? (
            <CountLabel
              className={css.countLabel}
              shown={comments.data.items.length}
              total={comments.data.total}
              label="comments"
            />
          ) : null}
        </div>
      )}

      <CommentComposer
        id={`${entityKey}-comment`}
        label="New manager comment"
        value={comments.draft}
        maxLength={PHARMACY_NOTE_MAX_LENGTH}
        placeholder={placeholder}
        disabled={!isEditable}
        isSaving={comments.isSaving}
        onValueChange={(value) =>
          comments.setDraft(value.slice(0, PHARMACY_NOTE_MAX_LENGTH))
        }
        onSubmit={() => void handleCreate()}
      />

      {isProfilePresentation ? (
        comments.status === 'loading' ? (
          <ProfileResourceState
            variant="loading"
            title="Loading comments"
            description="Please wait while manager comments are loaded."
          />
        ) : comments.status === 'error' ? (
          <ProfileResourceState
            variant="error"
            title="Comments could not be loaded"
            description={comments.error || 'Please try again.'}
            retryLabel="Retry comments"
            onRetry={comments.retry}
          />
        ) : (
          <CommentsList
            items={comments.data.items}
            title={null}
            commentTitle={commentTitle}
            emptyTitle={emptyTitle}
            emptyText={emptyText}
            emptyVariant="profile"
            deletingId={comments.deletingId}
            deleteDisabled={
              !isEditable || Boolean(comments.deletingId) || comments.isSaving
            }
            onDelete={comments.requestDelete}
          />
        )
      ) : (
        <>
          <CommentsList
            items={comments.data.items}
            commentTitle={commentTitle}
            emptyText={emptyText}
            error={comments.error}
            isLoading={comments.status === 'loading'}
            deletingId={comments.deletingId}
            deleteDisabled={
              !isEditable || Boolean(comments.deletingId) || comments.isSaving
            }
            onDelete={comments.requestDelete}
          />

          {comments.status === 'error' ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              iconLeft={<RefreshCw size={17} aria-hidden="true" />}
              onClick={() => void comments.retry()}
            >
              Retry comments
            </Button>
          ) : null}
        </>
      )}

      {comments.status === 'success' ? (
        <PaginationView
          currentPage={comments.data.page}
          totalPages={comments.data.totalPages}
          ariaLabel="Comments pagination"
          onPageChange={(page) => void comments.loadPage(page)}
        />
      ) : null}

      <ConfirmationModal
        isOpen={Boolean(comments.commentToDelete)}
        title="Delete this comment?"
        description="The comment will be permanently removed."
        confirmLabel="Delete comment"
        cancelLabel="Keep comment"
        destructive
        confirmButtonClassName={css.dangerConfirmButton}
        confirmIconLeft={<Trash2 size={17} aria-hidden="true" />}
        cancelIconLeft={<X size={17} aria-hidden="true" />}
        isLoading={Boolean(comments.deletingId)}
        onConfirm={() => void handleDelete()}
        onCancel={comments.cancelDelete}
      />
    </section>
  );
}
