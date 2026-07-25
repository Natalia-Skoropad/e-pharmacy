'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';

import type {
  PharmacyNote,
  PharmacyNotesResponse,
} from '@e-pharmacy/types/notes';

import { PHARMACY_NOTE_MAX_LENGTH } from '@e-pharmacy/validation/pharmacy';
import { CountLabel } from '@e-pharmacy/ui/data-display';

import {
  CommentsList,
  CommentComposer,
  useToast,
} from '@e-pharmacy/ui/feedback';

import { PaginationView } from '@e-pharmacy/ui/navigation';
import { ConfirmationModal } from '@e-pharmacy/ui/overlays';

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
  create: (text: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
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
  initialTotal = 0,
  isEditable = true,
  load,
  create,
  remove,
  onTotalChange,
}: EntityCommentsProps) {
  const toast = useToast();
  const generatedId = useId();
  const titleId = `${entityKey}-${generatedId}-comments-title`;
  const loadRef = useRef(load);
  const activeLoadControllerRef = useRef<AbortController | null>(null);
  const onTotalChangeRef = useRef(onTotalChange);

  const [data, setData] = useState<PharmacyNotesResponse>({
    items: [],
    page: 1,
    perPage: 10,
    total: initialTotal,
    totalPages: 1,
  });

  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
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
    onTotalChangeRef.current = onTotalChange;
  }, [onTotalChange]);

  const loadPage = useCallback(async (page: number): Promise<void> => {
    activeLoadControllerRef.current?.abort();
    const controller = new AbortController();
    activeLoadControllerRef.current = controller;

    setIsLoading(true);
    setError('');

    try {
      const response = await loadRef.current(page, {
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      setData(response);
      onTotalChangeRef.current?.(response.total);
    } catch (loadError) {
      if (controller.signal.aborted) return;

      setError(
        loadError instanceof Error && loadError.message
          ? loadError.message
          : 'Could not load comments.'
      );
    } finally {
      if (
        activeLoadControllerRef.current === controller &&
        !controller.signal.aborted
      ) {
        activeLoadControllerRef.current = null;
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    activeLoadControllerRef.current = controller;

    const loadInitialPage = async (): Promise<void> => {
      try {
        const response = await loadRef.current(1, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        setData(response);
        onTotalChangeRef.current?.(response.total);
      } catch (loadError) {
        if (controller.signal.aborted) return;

        setError(
          loadError instanceof Error && loadError.message
            ? loadError.message
            : 'Could not load comments.'
        );
      } finally {
        if (
          activeLoadControllerRef.current === controller &&
          !controller.signal.aborted
        ) {
          activeLoadControllerRef.current = null;
          setIsLoading(false);
        }
      }
    };

    void loadInitialPage();

    return () => {
      controller.abort();
      if (activeLoadControllerRef.current === controller) {
        activeLoadControllerRef.current = null;
      }
    };
  }, []);

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
    <section className={css.card} aria-labelledby={titleId}>
      <div className={css.head}>
        <h2 id={titleId}>{title}</h2>
        <CountLabel
          className={css.countLabel}
          shown={data.items.length}
          total={data.total}
          label="comments"
        />
      </div>

      <CommentComposer
        id={`${entityKey}-comment`}
        value={draft}
        maxLength={PHARMACY_NOTE_MAX_LENGTH}
        placeholder={placeholder}
        disabled={!isEditable}
        isSaving={isSaving}
        onValueChange={(value) =>
          setDraft(value.slice(0, PHARMACY_NOTE_MAX_LENGTH))
        }
        onSubmit={() => void handleCreate()}
      />

      <CommentsList
        items={data.items}
        commentTitle={commentTitle}
        emptyText={emptyText}
        error={error}
        isLoading={isLoading}
        deletingId={deletingId}
        deleteDisabled={!isEditable || Boolean(deletingId) || isSaving}
        onDelete={setCommentToDelete}
      />

      <PaginationView
        currentPage={data.page}
        totalPages={data.totalPages}
        ariaLabel="Comments pagination"
        disabled={isLoading}
        onPageChange={(page) => void loadPage(page)}
      />

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
