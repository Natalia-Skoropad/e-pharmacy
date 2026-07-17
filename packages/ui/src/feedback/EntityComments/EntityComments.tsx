'use client';

import { Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button, CountLabel, LoadingSpinner, Pagination } from '../../common';
import { CommentInput } from '../../form-fields';
import { ConfirmationModal } from '../../modals';
import { useToast } from '../ToastProvider';

import css from './EntityComments.module.css';

//===================================================================

export type EntityComment = Readonly<{
  id: string;
  text: string;
  createdAt: string;
}>;

export type EntityCommentsPage = Readonly<{
  items: EntityComment[];
  page: number;
  total: number;
  totalPages: number;
}>;

export type EntityCommentsProps = Readonly<{
  entityKey: string;
  title?: string;
  commentTitle?: string;
  placeholder?: string;
  emptyText?: string;
  initialTotal?: number;
  isEditable?: boolean;
  load: (page: number) => Promise<EntityCommentsPage>;
  create: (text: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  onTotalChange?: (total: number) => void;
}>;

//===================================================================

const COMMENT_MAX_LENGTH = 1000;

//===================================================================

function formatCommentDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

//===================================================================

export function EntityComments({
  entityKey,
  title = 'Comments',
  commentTitle = 'Comment',
  placeholder = 'Write an internal comment...',
  emptyText = 'No manager comments yet. The comment drawer is waiting patiently.',
  initialTotal = 0,
  isEditable = true,
  load,
  create,
  remove,
  onTotalChange,
}: EntityCommentsProps) {
  const toast = useToast();
  const loadRef = useRef(load);
  const onTotalChangeRef = useRef(onTotalChange);
  const [data, setData] = useState<EntityCommentsPage>({
    items: [],
    page: 1,
    total: initialTotal,
    totalPages: 1,
  });
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<EntityComment | null>(
    null
  );
  const [error, setError] = useState('');

  loadRef.current = load;
  onTotalChangeRef.current = onTotalChange;

  async function loadPage(page: number): Promise<void> {
    setIsLoading(true);
    setError('');

    try {
      const response = await loadRef.current(page);
      setData(response);
      onTotalChangeRef.current?.(response.total);
    } catch (loadError) {
      setError(
        loadError instanceof Error && loadError.message
          ? loadError.message
          : 'Could not load comments.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDraft('');
      setCommentToDelete(null);
      void loadPage(1);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [entityKey]);

  const handleCreate = async () => {
    const text = draft.trim();

    if (!text || isSaving || !isEditable) return;

    setIsSaving(true);

    try {
      await create(text);
      setDraft('');
      await loadPage(1);
      toast.success('Comment added successfully.');
    } catch (createError) {
      toast.error(
        createError instanceof Error && createError.message
          ? createError.message
          : 'Could not add the comment.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const comment = commentToDelete;

    if (!comment || deletingId || !isEditable) return;

    setCommentToDelete(null);
    setDeletingId(comment.id);

    try {
      await remove(comment.id);
      const nextPage =
        data.items.length === 1 && data.page > 1 ? data.page - 1 : data.page;

      await loadPage(nextPage);
      toast.success('Comment deleted successfully.');
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error && deleteError.message
          ? deleteError.message
          : 'Could not delete the comment.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section
      className={css.card}
      aria-labelledby={`${entityKey}-comments-title`}
    >
      <div className={css.head}>
        <h2 id={`${entityKey}-comments-title`}>{title}</h2>
        <CountLabel
          className={css.countLabel}
          shown={data.items.length}
          total={data.total}
          label="comments"
        />
      </div>

      <div className={css.composer}>
        <CommentInput
          id={`${entityKey}-comment`}
          name="entityComment"
          label="New manager comment"
          placeholder={placeholder}
          value={draft}
          error=""
          isTouched={false}
          maxLength={COMMENT_MAX_LENGTH}
          disabled={!isEditable || isSaving}
          onChange={(event) =>
            setDraft(event.target.value.slice(0, COMMENT_MAX_LENGTH))
          }
        />

        <Button
          className={css.addButton}
          type="button"
          disabled={!isEditable || !draft.trim() || isSaving}
          isLoading={isSaving}
          onClick={() => void handleCreate()}
        >
          Add comment
        </Button>
      </div>

      <div className={css.savedComments}>
        <h3>Saved comments</h3>

        {error ? <p className={css.error}>{error}</p> : null}
        {isLoading ? <LoadingSpinner label="Loading comments..." /> : null}

        {!isLoading && !error && data.items.length === 0 ? (
          <p className={css.empty}>{emptyText}</p>
        ) : null}

        {!isLoading && data.items.length > 0 ? (
          <ul className={css.list}>
            {data.items.map((comment) => (
              <li key={comment.id} className={css.comment}>
                <div className={css.commentHead}>
                  <div>
                    <strong>{commentTitle}</strong>
                    <time dateTime={comment.createdAt}>
                      {formatCommentDate(comment.createdAt)}
                    </time>
                  </div>

                  <Button
                    className={css.deleteButton}
                    type="button"
                    size="sm"
                    variant="ghost"
                    isLoading={deletingId === comment.id}
                    disabled={!isEditable || Boolean(deletingId) || isSaving}
                    onClick={() => setCommentToDelete(comment)}
                  >
                    <Trash2 size={17} aria-hidden="true" />
                    Delete
                  </Button>
                </div>

                <p>{comment.text}</p>
              </li>
            ))}
          </ul>
        ) : null}

        <Pagination
          currentPage={data.page}
          totalPages={data.totalPages}
          getPageHref={(page) => String(page)}
          ariaLabel="Comments pagination"
          renderLink={({
            href,
            className,
            children,
            'aria-label': ariaLabel,
          }) => (
            <button
              className={className}
              type="button"
              aria-label={ariaLabel}
              disabled={isLoading}
              onClick={() => void loadPage(Number(href))}
            >
              {children}
            </button>
          )}
        />
      </div>

      <ConfirmationModal
        isOpen={Boolean(commentToDelete)}
        title="Delete this comment?"
        description="The comment will be permanently removed."
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
