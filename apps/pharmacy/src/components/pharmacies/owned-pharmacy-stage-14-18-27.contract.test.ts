import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const source = (path: string) =>
  readFileSync(new URL(path, import.meta.url), 'utf8');

//===================================================================

test('verification transition has breathing room above the notice', () => {
  const modalStyle = source(
    '../../../../../packages/ui/src/overlays/ReasonModal/ReasonModal.module.css'
  );

  const modal = source(
    './OwnedPharmacyDetailPageContent/OwnedPharmacyActions.tsx'
  );

  assert.match(modal, /headerDetails=\{/);
  assert.match(modalStyle, /\.headerDetails\s*\{[^}]*margin-bottom:\s*16px/);
  assert.match(modal, /Send pharmacy for verification\?/);
});

//===================================================================

test('verification outcomes use real list markers and vertically centered statuses', () => {
  const actions = source(
    './OwnedPharmacyDetailPageContent/OwnedPharmacyActions.tsx'
  );

  const style = source(
    './OwnedPharmacyDetailPageContent/OwnedPharmacyDetailPageContent.module.css'
  );

  assert.match(actions, /<ul className=\{css\.reviewJourneyList\}>/);

  assert.equal(
    (actions.match(/<li className=\{css\.reviewJourneyItem\}>/g) ?? []).length,
    3
  );

  assert.match(actions, /label="Needs changes" tone="neutral"/);
  assert.match(actions, /The pharmacy requires corrections\./);
  assert.match(style, /\.reviewJourneyItem::before\s*\{[^}]*content:\s*''/);
  assert.match(style, /\.reviewJourneyItem\s*\{[^}]*align-items:\s*center/);
  assert.match(style, /\.reviewJourneyBadges\s*\{[^}]*align-items:\s*center/);
});

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
