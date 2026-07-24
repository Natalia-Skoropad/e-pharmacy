'use client';

import { Trash2 } from 'lucide-react';

import type { PharmacyNote } from '@e-pharmacy/types/notes';
import { formatDateTime } from '@e-pharmacy/utils/date';

import Button from '../../primitives/Button/Button';
import LoadingSpinner from '../../primitives/LoadingSpinner/LoadingSpinner';
import CommentInput from '../../forms/CommentInput/CommentInput';

import css from './Comments.module.css';

//===================================================================

export type CommentComposerProps = Readonly<{
  id: string;
  value: string;
  maxLength: number;
  placeholder?: string;
  disabled?: boolean;
  isSaving?: boolean;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
}>;

//===================================================================

export function CommentComposer({
  id,
  value,
  maxLength,
  placeholder = 'Write an internal comment...',
  disabled = false,
  isSaving = false,
  onValueChange,
  onSubmit,
}: CommentComposerProps) {
  return (
    <div className={css.composer}>
      <CommentInput
        id={id}
        name="entityComment"
        label="New manager comment"
        placeholder={placeholder}
        value={value}
        error=""
        isTouched={false}
        maxLength={maxLength}
        disabled={disabled || isSaving}
        onChange={(event) => onValueChange(event.target.value)}
      />

      <Button
        className={css.addButton}
        type="button"
        disabled={disabled || !value.trim() || isSaving}
        isLoading={isSaving}
        onClick={onSubmit}
      >
        Add comment
      </Button>
    </div>
  );
}

//===================================================================

export type CommentItemProps = Readonly<{
  comment: PharmacyNote;
  title?: string;
  isDeleting?: boolean;
  deleteDisabled?: boolean;
  onDelete?: (comment: PharmacyNote) => void;
}>;

//===================================================================

export function CommentItem({
  comment,
  title = 'Comment',
  isDeleting = false,
  deleteDisabled = false,
  onDelete,
}: CommentItemProps) {
  return (
    <li className={css.comment}>
      <div className={css.commentHead}>
        <div>
          <strong>{title}</strong>
          <time dateTime={comment.createdAt}>
            {formatDateTime(comment.createdAt) ?? '—'}
          </time>
        </div>

        {onDelete ? (
          <Button
            className={css.deleteButton}
            type="button"
            size="sm"
            variant="ghost"
            isLoading={isDeleting}
            disabled={deleteDisabled}
            onClick={() => onDelete(comment)}
          >
            <Trash2 size={17} aria-hidden="true" />
            Delete
          </Button>
        ) : null}
      </div>

      <p>{comment.text}</p>
    </li>
  );
}

//===================================================================

export type CommentsListProps = Readonly<{
  items: readonly PharmacyNote[];
  title?: string;
  commentTitle?: string;
  emptyText?: string;
  error?: string;
  isLoading?: boolean;
  deletingId?: string | null;
  deleteDisabled?: boolean;
  onDelete?: (comment: PharmacyNote) => void;
}>;

//===================================================================

export function CommentsList({
  items,
  title = 'Saved comments',
  commentTitle = 'Comment',
  emptyText = 'No comments yet.',
  error,
  isLoading = false,
  deletingId,
  deleteDisabled = false,
  onDelete,
}: CommentsListProps) {
  return (
    <div className={css.savedComments}>
      <h3>{title}</h3>

      {error ? <p className={css.error}>{error}</p> : null}
      {isLoading ? <LoadingSpinner label="Loading comments..." /> : null}

      {!isLoading && !error && items.length === 0 ? (
        <p className={css.empty}>{emptyText}</p>
      ) : null}

      {!isLoading && items.length > 0 ? (
        <ul className={css.list}>
          {items.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              title={commentTitle}
              isDeleting={deletingId === comment.id}
              deleteDisabled={deleteDisabled}
              onDelete={onDelete}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
