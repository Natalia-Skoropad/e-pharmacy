import type {
  CreatePositionPayload,
  CreateProductCategoryPayload,
  PositionEntity,
  PositionListResponse,
  ProductCategoryEntity,
  ProductCategoryListResponse,
  ProductCategoryReference,
  ReferenceDataListQueryParams,
} from '../src/reference-data';

import type {
  CalendarDateString,
  EntityId,
  ISODateTimeString,
} from '../src/primitives';

//===================================================================

declare const id: EntityId;
declare const instant: ISODateTimeString;
declare const calendarDate: CalendarDateString;

//===================================================================

const query: ReferenceDataListQueryParams = {
  page: 1,
  perPage: 20,
  keyword: 'medical',
  createdFrom: calendarDate,
  createdTo: calendarDate,
};

//===================================================================

void query;

//===================================================================

const category: ProductCategoryEntity = {
  id,
  name: 'Medical devices',
  slug: 'medical_devices',
  status: 'active',
  kind: 'standard',
  sortOrder: 50,
  createdAt: instant,
  updatedAt: instant,
  createdBy: id,
  updatedBy: id,
};

const categoryReference: ProductCategoryReference = {
  id: category.id,
  name: category.name,
  slug: category.slug,
};

void categoryReference;

// @ts-expect-error Category snapshots are readonly.
category.name = 'Changed';

const invalidCategoryKind: ProductCategoryEntity = {
  ...category,
  // @ts-expect-error Custom fallback is not a persisted ProductCategory kind.
  kind: 'custom_fallback',
};

void invalidCategoryKind;

//===================================================================

const position: PositionEntity = {
  id,
  name: 'Content manager',
  createdAt: instant,
  updatedAt: instant,
  createdBy: id,
  updatedBy: id,
};

// @ts-expect-error Position snapshots are readonly.
position.name = 'Changed';

//===================================================================

const categoryPayload: CreateProductCategoryPayload = {
  name: 'Baby care',
};

const positionPayload: CreatePositionPayload = {
  name: 'Accountant',
};

void categoryPayload;
void positionPayload;

//===================================================================

declare const categories: ProductCategoryListResponse;
declare const positions: PositionListResponse;

void categories.earliestCreatedAt;
void categories.items[0]?.usage.productsCount;
void categories.items[0]?.usage.productRequestsCount;
void positions.earliestCreatedAt;
void positions.items[0]?.usage.employeesCount;

// @ts-expect-error Paginated reference-data responses are readonly snapshots.
categories.items.push(categories.items[0]);
