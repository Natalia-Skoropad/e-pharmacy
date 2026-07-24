import type { ApiPaginationResponse } from '../src/api';
import type { CheckoutOrderPayload, OrderStatus } from '../src/orders';

import type {
  CompletePharmacyBankDetails,
  EditablePharmacyBankDetails,
} from '../src/pharmacies';

import type {
  CalendarDateString,
  EntityId,
  ISODateTimeString,
} from '../src/primitives';

import type { ProductRequestResponseDto } from '../src/product-requests';

//===================================================================
// Dates are intentionally different contracts.

declare const calendarDate: CalendarDateString;
declare const instant: ISODateTimeString;

// @ts-expect-error A calendar date is not an instant in time.
const timestamp: ISODateTimeString = calendarDate;

void instant;
void timestamp;

//===================================================================
// Delivery is discriminated by deliveryMethod.

declare const pharmacyId: EntityId;
declare const postalDetails: {
  recipientName: string;
  recipientPhone: string;
  address: string;
};

const pickup: CheckoutOrderPayload = {
  pharmacyId,
  paymentMethod: 'cash',
  deliveryMethod: 'pickup',
};

// @ts-expect-error Pickup cannot contain postal delivery details.
pickup.deliveryDetails = postalDetails;

//===================================================================
// Editable bank details cannot be used as complete checkout details.

const editable: EditablePharmacyBankDetails = {
  iban: 'UA000000000000000000000000000',
};

// @ts-expect-error Incomplete bank details are not checkout-ready.
const complete: CompletePharmacyBankDetails = editable;

void complete;

//===================================================================
// Raw transport data is not a normalized pharmacy view model.

type ProductRequestRowViewModel = Readonly<{
  id: EntityId;
  requestNumber: string;
  createdAt: ISODateTimeString;
  status: 'draft' | 'new' | 'in_progress' | 'approved' | 'rejected';
}>;

declare const dto: ProductRequestResponseDto;

// @ts-expect-error Raw optional transport data is not a normalized row.
const row: ProductRequestRowViewModel = dto;

void row;

//===================================================================
// Pagination metadata is mandatory and response snapshots are readonly.

declare const paginated: ApiPaginationResponse<{ id: EntityId }>;

paginated.page;
paginated.perPage;
paginated.total;
paginated.totalPages;
paginated.items;

// @ts-expect-error API response arrays are readonly snapshots.
paginated.items.push({ id: pharmacyId });

// @ts-expect-error Pagination response requires all metadata fields.
const incompletePagination: ApiPaginationResponse<{ id: EntityId }> = {
  items: [],
  page: 1,
  total: 0,
  totalPages: 1,
};

void incompletePagination;

//===================================================================
// Status mappings must remain exhaustive.

const labels = {
  new: 'New',
  in_progress: 'In progress',
  successful: 'Successful',
  rejected: 'Rejected',
} satisfies Record<OrderStatus, string>;

void labels;

//===================================================================
// Payload/form state remains mutable.

const editablePayload: EditablePharmacyBankDetails = {};
editablePayload.iban = 'UA111111111111111111111111111';
