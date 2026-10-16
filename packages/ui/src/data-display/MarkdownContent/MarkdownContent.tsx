import { markdownToHtml } from './markdown-to-html';
import css from './MarkdownContent.module.css';

//===================================================================

type MarkdownContentProps = Readonly<{ value: string; className?: string }>;

//===================================================================

/** Read-only equivalent of the pharmacy MarkdownTextarea editor preview. */
export function MarkdownContent({ value, className }: MarkdownContentProps) {
  return (
    <div
      className={[css.content, className].filter(Boolean).join(' ')}
      dangerouslySetInnerHTML={{ __html: markdownToHtml(value) }}
    />
  );
}
