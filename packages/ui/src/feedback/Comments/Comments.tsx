'use client';

import { MessageSquarePlus, Trash2 } from 'lucide-react';

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
  label?: string;
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
  label = 'New comment',
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
        label={label}
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
        iconLeft={<MessageSquarePlus size={17} aria-hidden="true" />}
        onClick={onSubmit}
      >
        Add comment
      </Button>
    </div>
  );
}

//===================================================================

export type CommentListItem = Readonly<{
  id: string;
  text: string;
  createdAt: string;
  author: Readonly<{
    displayName: string;
  }>;
}>;

//===================================================================

export type CommentItemProps<
  TComment extends CommentListItem = CommentListItem,
> = Readonly<{
  comment: TComment;
  title?: string;
  isDeleting?: boolean;
  deleteDisabled?: boolean;
  onDelete?: (comment: TComment) => void;
}>;

//===================================================================

export function CommentItem<
  TComment extends CommentListItem = CommentListItem,
>({
  comment,
  title = 'Comment',
  isDeleting = false,
  deleteDisabled = false,
  onDelete,
}: CommentItemProps<TComment>) {
  return (
    <li className={css.comment}>
      <div className={css.commentHead}>
        <div>
          <strong>{comment.author.displayName || title}</strong>

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

export type CommentsListProps<
  TComment extends CommentListItem = CommentListItem,
> = Readonly<{
  items: readonly TComment[];
  title?: string;
  commentTitle?: string;
  emptyText?: string;
  error?: string;
  isLoading?: boolean;
  deletingId?: string | null;
  deleteDisabled?: boolean;
  onDelete?: (comment: TComment) => void;
}>;

//===================================================================

export function CommentsList<
  TComment extends CommentListItem = CommentListItem,
>({
  items,
  title = 'Saved comments',
  commentTitle = 'Comment',
  emptyText = 'No comments yet.',
  error,
  isLoading = false,
  deletingId,
  deleteDisabled = false,
  onDelete,
}: CommentsListProps<TComment>) {
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
