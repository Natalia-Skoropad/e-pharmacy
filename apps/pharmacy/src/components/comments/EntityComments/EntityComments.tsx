'use client';

import { useId } from 'react';
import { RefreshCw } from 'lucide-react';

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
  commentTitle?: string;
  placeholder?: string;
  emptyText?: string;
  initialTotal?: number;
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
  commentTitle = 'Comment',
  placeholder = 'Write an internal comment...',
  emptyText = 'No manager comments yet. The comment drawer is waiting patiently.',
  initialTotal,
  isEditable = true,
  load,
  create,
  remove,
  onTotalChange,
}: EntityCommentsProps) {
  const toast = useToast();
  const generatedId = useId();
  const titleId = `${entityKey}-${generatedId}-comments-title`;

  const comments = useEntityCommentsResource({
    initialTotal,
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
        confirmButtonClassName={css.dangerConfirmButton}
        isLoading={Boolean(comments.deletingId)}
        onConfirm={() => void handleDelete()}
        onCancel={comments.cancelDelete}
      />
    </section>
  );
}
