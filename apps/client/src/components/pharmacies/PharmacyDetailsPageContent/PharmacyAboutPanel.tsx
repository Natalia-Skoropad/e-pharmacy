import { Fragment, type ReactNode } from 'react';

import type { PublicPharmacy } from '@e-pharmacy/types/pharmacies';

import css from './PharmacyAboutPanel.module.css';

//===================================================================

export type PharmacyAboutPanelProps = Readonly<{
  pharmacy: PublicPharmacy;
}>;

//===================================================================

type DescriptionBlock =
  | Readonly<{ type: 'heading'; text: string }>
  | Readonly<{ type: 'paragraph'; text: string }>
  | Readonly<{ type: 'list'; items: readonly string[] }>;

//===================================================================

function renderInlineEmphasis(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    const match = part.match(/^\*\*(.+)\*\*$/);

    return match ? (
      <strong key={index}>{match[1]}</strong>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    );
  });
}

//===================================================================

function parseDescription(description?: string): readonly DescriptionBlock[] {
  const normalized = description?.trim();
  if (!normalized) {
    return [
      {
        type: 'paragraph',
        text: 'The pharmacy has not added a public description yet.',
      },
    ];
  }

  const blocks: DescriptionBlock[] = [];
  const paragraphLines: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (!paragraphLines.length) return;
    blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') });
    paragraphLines.length = 0;
  };

  const flushList = () => {
    if (!listItems.length) return;
    blocks.push({ type: 'list', items: listItems });
    listItems = [];
  };

  for (const rawLine of normalized.replace(/\r\n?/g, '\n').split('\n')) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = line.match(/^\*\*(.+)\*\*$/);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'heading', text: heading[1] ?? '' });
      continue;
    }

    if (/^-\s+/.test(line)) {
      flushParagraph();
      listItems.push(line.replace(/^-\s+/, ''));
      continue;
    }

    flushList();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}

//===================================================================

export function PharmacyAboutPanel({ pharmacy }: PharmacyAboutPanelProps) {
  const blocks = parseDescription(pharmacy.description);

  return (
    <div className={css.panel}>
      <div className={css.header}>
        <h2 className={css.title}>About {pharmacy.name}</h2>
      </div>

      <div className={css.description}>
        {blocks.map((block, index) => {
          if (block.type === 'heading') {
            return (
              <h3 key={`heading-${index}`}>
                {renderInlineEmphasis(block.text)}
              </h3>
            );
          }

          if (block.type === 'list') {
            return (
              <ul key={`list-${index}`}>
                {block.items.map((item, itemIndex) => (
                  <li key={`${index}-${itemIndex}`}>
                    {renderInlineEmphasis(item)}
                  </li>
                ))}
              </ul>
            );
          }

          return (
            <p key={`paragraph-${index}`}>{renderInlineEmphasis(block.text)}</p>
          );
        })}
      </div>
    </div>
  );
}
