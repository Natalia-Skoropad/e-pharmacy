import type {
  AdminAuditDetails,
  AdminAuditListItem,
  AdminAuditSnapshot,
  AdminAuditValue,
} from './admin-audit';

//===============================================================

// Order and wording match the actual Product request tabs. The raw audit
// remains immutable; its user-facing rows follow form order in one table.
const GROUPS = [
  {
    title: 'Product data',
    fields: [
      {
        key: 'productImage',
        label: 'Product image',
        sources: ['productImageName', 'productImageFingerprint'],
      },
      { key: 'name', label: 'Product name', sources: ['name'] },
      { key: 'article', label: 'Product article', sources: ['article'] },
      {
        key: 'category',
        label: 'Category',
        sources: ['categoryId', 'categoryMode', 'categoryName'],
      },
      {
        key: 'customCategory',
        label: 'Other category',
        sources: ['customCategory'],
      },
    ],
  },
  {
    title: 'Characteristics',
    fields: [
      { key: 'brand', label: 'Brand', sources: ['brand'] },
      { key: 'series', label: 'Series / Line', sources: ['series'] },
      { key: 'manufacturer', label: 'Manufacturer', sources: ['manufacturer'] },
      { key: 'releaseForm', label: 'Release form', sources: ['releaseForm'] },
      {
        key: 'activeIngredients',
        label: 'Active ingredients',
        sources: ['activeIngredients'],
      },
      {
        key: 'activeIngredientCount',
        label: 'Active ingredient count',
        sources: ['activeIngredientCount'],
      },
    ],
  },
  {
    title: 'About product',
    fields: [
      {
        key: 'fullDescription',
        label: 'About product',
        sources: ['fullDescription'],
      },
    ],
  },
  {
    title: 'Note for Admin',
    fields: [
      {
        key: 'pharmacyComment',
        label: 'Pharmacy note for Admin',
        sources: ['pharmacyComment'],
      },
    ],
  },
  {
    title: 'Documents',
    fields: [
      {
        key: 'additionalFiles',
        label: 'Files and documents',
        sources: ['additionalFiles'],
      },
    ],
  },
  {
    title: 'Status',
    fields: [
      {
        key: 'status',
        label: 'Status',
        sources: ['status', 'reviewState', 'cancelledBy'],
      },
    ],
  },
] as const;

//===============================================================

type AuditItem = Pick<AdminAuditListItem, 'action' | 'changedFields'>;
type Field = (typeof GROUPS)[number]['fields'][number];

//===============================================================

export type ProductRequestAuditStatus = Readonly<{
  value: string;
  needsChanges: boolean;
  cancellation: 'admin' | 'owner' | null;
}>;

//===============================================================

export type ProductRequestAuditCategory = Readonly<{
  custom: boolean;
  icon?: string;
  currentCatalogIcon?: boolean;
}>;

//===============================================================

function categoryPresentation(
  snapshot: AdminAuditSnapshot,
  field: string
): ProductRequestAuditCategory {
  const custom =
    field === 'customCategory' || snapshot.categoryMode === 'custom';

  return {
    custom,

    ...(!custom &&
    typeof snapshot.categoryIcon === 'string' &&
    snapshot.categoryIcon
      ? {
          icon: snapshot.categoryIcon,
          currentCatalogIcon: snapshot.categoryIconSource === 'current_catalog',
        }
      : {}),
  };
}

//===============================================================

export type ProductRequestAuditRow = Readonly<{
  field: string;
  label: string;
  developerField: string;
  before: AdminAuditValue;
  after: AdminAuditValue;
  beforeCategory?: ProductRequestAuditCategory;
  afterCategory?: ProductRequestAuditCategory;
  beforeStatus?: ProductRequestAuditStatus;
  afterStatus?: ProductRequestAuditStatus;
}>;

//===============================================================

function includeField(item: AuditItem, field: Field): boolean {
  // Creation is a form snapshot, including fields not filled yet.
  return (
    item.action === 'productRequest.created' ||
    field.sources.some((source) => item.changedFields.includes(source))
  );
}

//===============================================================

function fieldLabel(
  field: Field,
  group: (typeof GROUPS)[number]['title']
): string {
  return group === 'Status' ? field.label : `${field.label} (${group})`;
}

//===============================================================

export function getProductRequestAuditFieldLabels(item: AuditItem): string[] {
  return GROUPS.flatMap((group) =>
    group.fields
      .filter((field) => includeField(item, field))
      .map((field) => fieldLabel(field, group.title))
  );
}

//===============================================================

function nonEmpty(value: AdminAuditValue | undefined): AdminAuditValue {
  if (value == null || value === '' || (Array.isArray(value) && !value.length))
    return null;

  return value;
}

//===============================================================

function categoryValue(snapshot: AdminAuditSnapshot): AdminAuditValue {
  if (snapshot.categoryMode === 'custom') return 'Other category';

  if (typeof snapshot.categoryName === 'string' && snapshot.categoryName)
    return snapshot.categoryName;

  return snapshot.categoryId ? 'Category name not recorded' : null;
}

//===============================================================

function photoValue(snapshot: AdminAuditSnapshot): AdminAuditValue {
  return (
    nonEmpty(snapshot.productImageName) ??
    (snapshot.productImageFingerprint
      ? 'Historical photo preview unavailable'
      : null)
  );
}

//===============================================================

function documentValues(value: AdminAuditValue | undefined): AdminAuditValue {
  if (!Array.isArray(value)) return nonEmpty(value);

  // Stored document entries end with an internal ID or SHA-256 hash.
  // Preserve filenames, MIME types and sizes, but do not display that token.
  return nonEmpty(
    value.map((file) =>
      file
        .replace(
          /(\(.*?, \d+ bytes\))\s+(?:[a-f\d]{24}|[a-f\d]{64})\s*$/i,
          '$1'
        )
        .trim()
    )
  );
}

//===============================================================

function displayValue(
  snapshot: AdminAuditSnapshot,
  field: string
): AdminAuditValue {
  if (field === 'category') return categoryValue(snapshot);
  if (field === 'productImage') return photoValue(snapshot);

  if (field === 'additionalFiles')
    return documentValues(snapshot.additionalFiles);

  const value = nonEmpty(snapshot[field]);

  // Long text is stored as consecutive chunks, not a comma-separated list.
  if (
    ['fullDescription', 'pharmacyComment'].includes(field) &&
    Array.isArray(value)
  )
    return value.join('');

  return value;
}

//===============================================================

function statusValue(
  snapshot: AdminAuditSnapshot,
  fallback?: string
): ProductRequestAuditStatus | undefined {
  const value =
    typeof snapshot.status === 'string' ? snapshot.status : fallback;

  if (!value) return undefined;

  return {
    value,
    needsChanges: snapshot.reviewState === 'changes_requested',

    cancellation:
      value === 'rejected' &&
      (snapshot.cancelledBy === 'admin' || snapshot.cancelledBy === 'owner')
        ? snapshot.cancelledBy
        : null,
  };
}

//===============================================================

export function getProductRequestAuditRows(
  details: AdminAuditDetails
): readonly ProductRequestAuditRow[] {
  return GROUPS.flatMap((group) =>
    group.fields
      .filter((field) => includeField(details, field))
      .map((field): ProductRequestAuditRow => {
        const before = displayValue(details.before, field.key);

        let after = displayValue(details.after, field.key);

        // Equal filenames do not imply identical photo/document contents.
        if (
          field.key === 'productImage' &&
          before !== null &&
          before === after &&
          details.changedFields.includes('productImageFingerprint')
        ) {
          after = `${String(after)} (image changed)`;
        }

        if (
          field.key === 'additionalFiles' &&
          Array.isArray(after) &&
          JSON.stringify(before) === JSON.stringify(after) &&
          details.changedFields.includes('additionalFiles')
        ) {
          after = [...after, 'Document contents or references changed'];
        }

        return {
          field: field.key,
          label: fieldLabel(field, group.title),
          developerField: field.sources[0],
          before,
          after,

          ...(['category', 'customCategory'].includes(field.key)
            ? {
                beforeCategory: categoryPresentation(details.before, field.key),
                afterCategory: categoryPresentation(details.after, field.key),
              }
            : {}),

          ...(field.key === 'status'
            ? {
                beforeStatus: statusValue(details.before, details.statusBefore),
                afterStatus: statusValue(details.after, details.statusAfter),
              }
            : {}),
        };
      })
  );
}

//===============================================================

export function getProductRequestAuditReason(
  details: AdminAuditDetails
): string | undefined {
  if (details.action === 'productRequest.created') return undefined;
  if (details.reason) return details.reason;

  if (
    details.action !== 'productRequest.status.changed' ||
    !details.changedFields.includes('rejectionReason')
  )
    return undefined;

  const reason = details.after.rejectionReason;

  return typeof reason === 'string' && reason.trim() ? reason : undefined;
}
