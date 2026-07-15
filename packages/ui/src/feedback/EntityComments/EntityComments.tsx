'use client';

import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button, CountLabel, LoadingSpinner } from '../../common';
import { CommentInput } from '../../form-fields';

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

//===================================================================

export function EntityComments({
  title = 'Comments',
  load,
  create,
  remove,
}: Readonly<{
  title?: string;
  load: (page: number) => Promise<EntityCommentsPage>;
  create: (text: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}>) {
  const [data, setData] = useState<EntityCommentsPage>({
    items: [],
    page: 1,
    total: 0,
    totalPages: 1,
  });
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function refresh(page = data.page) {
    setLoading(true);
    try {
      setData(await load(page));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh(1);
  }, []);

  return (
    <section className={css.card}>
      <div className={css.head}>
        <h2>{title}</h2>
        <CountLabel
          shown={data.items.length}
          total={data.total}
          label="comments"
        />
      </div>
      <div className={css.composer}>
        <CommentInput
          id="entity-comment"
          name="entityComment"
          label="New manager comment"
          value={draft}
          error=""
          isTouched={false}
          maxLength={1000}
          disabled={busy}
          onChange={(e) => setDraft(e.target.value.slice(0, 1000))}
        />
        <Button
          fullWidth
          type="button"
          disabled={!draft.trim() || busy}
          isLoading={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await create(draft.trim());
              setDraft('');
              await refresh(1);
            } finally {
              setBusy(false);
            }
          }}
        >
          Add comment
        </Button>
      </div>
      {loading ? <LoadingSpinner label="Loading comments..." /> : null}
      {!loading && !data.items.length ? (
        <p className={css.empty}>No manager comments yet.</p>
      ) : null}
      <ul className={css.list}>
        {data.items.map((comment) => (
          <li key={comment.id} className={css.comment}>
            <div>
              <strong>Comment</strong>
              <time dateTime={comment.createdAt}>
                {new Intl.DateTimeFormat('en-GB', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(comment.createdAt))}
              </time>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={css.delete}
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await remove(comment.id);
                  await refresh();
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Trash2 size={16} />
              Delete
            </Button>
            <p>{comment.text}</p>
          </li>
        ))}
      </ul>
      {data.totalPages > 1 ? (
        <div className={css.pagination}>
          <Button
            size="sm"
            variant="secondary"
            disabled={data.page <= 1 || loading}
            onClick={() => void refresh(data.page - 1)}
          >
            Previous
          </Button>
          <span>
            {data.page} / {data.totalPages}
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={data.page >= data.totalPages || loading}
            onClick={() => void refresh(data.page + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </section>
  );
}
