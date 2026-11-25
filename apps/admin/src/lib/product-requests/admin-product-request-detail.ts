import { isRecord } from '@e-pharmacy/utils/guards';

import { isValidObjectId } from '@e-pharmacy/validation/url';
import { isProductRequestStatus } from '@e-pharmacy/validation/product-requests';
import type { ProductRequestFormValues } from '@e-pharmacy/validation/product-requests';

import type { ProductRequestStatus } from '@e-pharmacy/types/product-requests';
import type { FileMetadata } from '@e-pharmacy/types/primitives';

import {
  normalizeProductRequest,
  type ProductRequestRowViewModel,
} from './admin-product-requests';

//===============================================================

type SavedRequestFile = FileMetadata &
  Readonly<{ id: string; documentId?: string; dataUrl?: string }>;

//===============================================================

export const REQUEST_TABS = [
  'details',
  'product-data',
  'characteristics',
  'about-product',
  'note-for-admin',
  'documents',
  'comments',
  'activity',
] as const;

export type RequestTab = (typeof REQUEST_TABS)[number];

export const REQUEST_TAB_LABELS: Record<RequestTab, string> = {
  details: 'Details',
  'product-data': 'Product data',
  characteristics: 'Characteristics',
  'about-product': 'About product',
  'note-for-admin': 'Note for Admin',
  documents: 'Documents',
  comments: 'Comments',
  activity: 'Activity history',
};

//===============================================================

export function isRequestTab(value: string): value is RequestTab {
  return REQUEST_TABS.some((tab) => tab === value);
}

//===============================================================

export function requestTabPath(id: string, tab: RequestTab) {
  return `/admin/product-requests/${encodeURIComponent(id)}${tab === 'details' ? '' : `/${tab}`}`;
}

//===============================================================

export type RequestOwner = {
  id: string;
  name: string;
  pictureUrl?: string;
  status: 'new' | 'active' | 'blocked';
};

export type RequestHistoryEntry = {
  id: string;
  status: ProductRequestStatus;
  title: string;
  description: string;
  createdAt: string;
  isInferred: boolean;
  actorName?: string;
  actorNameSource?: 'current_owner';
};

export type AdminRequestDetail = ProductRequestRowViewModel & {
  name: string;
  updatedAt?: string;
  history: RequestHistoryEntry[];
  values: ProductRequestFormValues;
  image?: SavedRequestFile;
  files: SavedRequestFile[];
  ownerDetail?: RequestOwner;
  rejectionReason?: string;
};

//===============================================================

const str = (value: unknown) => (typeof value === 'string' ? value : '');

//===============================================================

function file(value: unknown, index: number): SavedRequestFile | undefined {
  if (
    !isRecord(value) ||
    typeof value.name !== 'string' ||
    typeof value.type !== 'string' ||
    typeof value.size !== 'number'
  )
    return undefined;
  const documentId =
    typeof value.documentId === 'string' && isValidObjectId(value.documentId)
      ? value.documentId
      : undefined;
  return {
    id: documentId ?? `saved-${index}`,
    name: value.name,
    type: value.type,
    size: value.size,
    ...(documentId ? { documentId } : {}),
    ...(typeof value.dataUrl === 'string' ? { dataUrl: value.dataUrl } : {}),
  };
}

//===============================================================

export function parseAdminRequestDetail(raw: unknown): AdminRequestDetail {
  if (!isRecord(raw) || !isRecord(raw.request))
    throw new Error('Invalid product request response.');

  const r = raw.request;
  const row = normalizeProductRequest(r);

  if (!row || !str(r.name)) throw new Error('Invalid product request details.');

  const o = raw.owner;

  const ownerDetail: RequestOwner | undefined =
    isRecord(o) &&
    typeof o.id === 'string' &&
    isValidObjectId(o.id) &&
    typeof o.name === 'string' &&
    (o.status === 'new' || o.status === 'active' || o.status === 'blocked')
      ? {
          id: o.id,
          name: o.name,
          status: o.status,

          ...(typeof o.pictureUrl === 'string'
            ? { pictureUrl: o.pictureUrl }
            : {}),
        }
      : undefined;

  const history: RequestHistoryEntry[] = Array.isArray(r.history)
    ? r.history.flatMap((entry) => {
        if (
          !isRecord(entry) ||
          !isProductRequestStatus(entry.status) ||
          typeof entry.id !== 'string' ||
          typeof entry.title !== 'string' ||
          typeof entry.description !== 'string' ||
          typeof entry.createdAt !== 'string' ||
          !Number.isFinite(Date.parse(entry.createdAt))
        )
          return [];

        return [
          {
            id: entry.id,
            status: entry.status,
            title: entry.title,
            description: entry.description,
            createdAt: entry.createdAt,
            isInferred: entry.isInferred !== false,

            ...(entry.isInferred === false &&
            typeof entry.actorName === 'string' &&
            entry.actorName.trim()
              ? {
                  actorName: entry.actorName.trim(),

                  ...(entry.actorNameSource === 'current_owner'
                    ? { actorNameSource: 'current_owner' as const }
                    : {}),
                }
              : {}),
          },
        ];
      })
    : [];

  return {
    ...row,
    history,
    name: str(r.name),
    updatedAt: str(r.updatedAt),
    ownerDetail,
    rejectionReason: str(r.rejectionReason),
    image: file(r.productImage, 0),

    files: Array.isArray(r.additionalFiles)
      ? r.additionalFiles
          .map(file)
          .filter((f): f is SavedRequestFile => Boolean(f))
      : [],

    values: {
      name: str(r.name),
      article: str(r.article),
      categoryMode: row.categoryMode,
      categoryId: row.category?.id ?? '',
      customCategory: str(r.customCategory),
      brand: str(r.brand),
      series: str(r.series),
      manufacturer: str(r.manufacturer),
      releaseForm: str(r.releaseForm),
      activeIngredients: str(r.activeIngredients),
      activeIngredientCount: str(r.activeIngredientCount),
      fullDescription: str(r.fullDescription),
      pharmacyComment: str(r.pharmacyComment),
    },
  };
}
