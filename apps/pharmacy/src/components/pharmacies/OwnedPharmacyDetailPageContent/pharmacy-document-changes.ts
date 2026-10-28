import type { PharmacyDocument } from '../OwnedPharmacyEditor/pharmacy-editor-types';

//===================================================================

/**
 * Apply edits made against the published list without discarding other
 * documents that were already saved for moderation.
 */
export function mergeProposedPharmacyDocuments(
  published: readonly PharmacyDocument[],
  selected: readonly PharmacyDocument[],
  proposed: readonly PharmacyDocument[]
): PharmacyDocument[] {
  const selectedIds = new Set(selected.map((document) => document.id));
  const publishedIds = new Set(published.map((document) => document.id));

  const removed = new Set(
    published
      .filter((document) => !selectedIds.has(document.id))
      .map((document) => document.id)
  );

  const merged = proposed.filter((document) => !removed.has(document.id));
  const mergedIds = new Set(merged.map((document) => document.id));

  for (const document of selected) {
    if (publishedIds.has(document.id) || mergedIds.has(document.id)) continue;

    merged.push(document);
    mergedIds.add(document.id);
  }

  return merged;
}
