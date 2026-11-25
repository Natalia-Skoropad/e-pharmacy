'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { MarkdownContent } from '@e-pharmacy/ui/data-display';
import { Button } from '@e-pharmacy/ui/primitives';

import css from './ActivityHistory.module.css';

//===================================================================

// Shared by all audit comparison tables.
export function AuditLongText({ value }: Readonly<{ value: string }>) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = value.length > 180 || value.split('\n').length > 5;

  return (
    <div className={css.auditLongText}>
      <div
        className={[
          css.auditTextContent,
          !expanded && canExpand ? css.auditTextCollapsed : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <MarkdownContent value={value} />
      </div>
      {canExpand ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          fullWidth
          className={css.auditExpandButton}
          iconLeft={
            expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />
          }
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? 'Show less' : 'Show more'}
        </Button>
      ) : null}
    </div>
  );
}
