import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const source = (path: string) =>
  readFileSync(new URL(path, import.meta.url), 'utf8');

//===================================================================

test('Audit details uses the same compact expand control for descriptions and comment text', () => {
  const modal = source(
    '../../../../admin/src/components/activity/AuditDetailsModal.tsx'
  );

  const style = source(
    '../../../../admin/src/components/activity/ActivityHistory.module.css'
  );

  assert.match(
    modal,
    /\['description', 'shortDescription', 'text'\]\.includes\(field\)/
  );

  assert.match(modal, /<AuditLongText value=\{value\} \/>/);
  assert.match(modal, /<AuditLongText value=\{details\.reason\} \/>/);
  assert.match(modal, /<MarkdownContent value=\{value\} \/>/);
  assert.match(modal, /className=\{css\.auditExpandButton\}/);
  assert.match(modal, /iconLeft=\{\s*expanded \? <ChevronUp/);
  assert.match(modal, /fullWidth/);

  assert.match(
    style,
    /\.auditLongText \.auditTextContent :is\(h1, h2, h3, h4, h5, h6\)/
  );

  assert.match(
    style,
    /\.auditLongText > \.auditExpandButton\s*\{[^}]*width:\s*100%/
  );
});
