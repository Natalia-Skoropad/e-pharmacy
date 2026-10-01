import type { Types } from 'mongoose';

import type { PRODUCT_REQUEST_CATEGORY_MODES } from '../constants/product-request';
import type { PRODUCT_REQUEST_STATUSES } from '../constants/product-request-validation';
import type { ProductCategoryReferenceDto } from './product-category';
import type { CalendarDateString, ISODateTimeString } from './date';

//===============================================================

export type ProductRequestStatus = (typeof PRODUCT_REQUEST_STATUSES)[number];

export type ProductRequestCategoryMode =
  (typeof PRODUCT_REQUEST_CATEGORY_MODES)[number];

//===============================================================

export type ProductRequestFile = {
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
};

export type ProductRequestHistoryEntry = {
  status: ProductRequestStatus;
  title: string;
  description: string;
  createdAt: Date;
};

//===============================================================

export type ProductRequestEntity = {
  pharmacyId: Types.ObjectId;
  name: string;
  article: string;
  categoryMode: ProductRequestCategoryMode;
  categoryId?: Types.ObjectId;
  customCategory?: string;
  status: ProductRequestStatus;
  productId?: Types.ObjectId;
  productImage?: ProductRequestFile;
  manufacturer?: string;
  countryOfOrigin?: string;
  dosage?: string;
  packageSize?: string;
  form?: string;
  activeSubstance?: string;
  prescriptionType?: string;
  fullDescription?: string;
  pharmacyComment?: string;
  additionalFiles?: ProductRequestFile[];
  rejectionReason?: string;
  history?: ProductRequestHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
};

//===============================================================

export type ProductRequestResponseDto = {
  id: string;
  createdAt: ISODateTimeString;
  updatedAt?: ISODateTimeString;
  requestNumber?: string;
  productId?: string;
  productImageUrl?: string;
  productArticle?: string;
  productName?: string;
  article: string;
  name: string;
  categoryMode: ProductRequestCategoryMode;
  category?: ProductCategoryReferenceDto;
  customCategory?: string;
  status: ProductRequestStatus;
  productImage?: ProductRequestFile;
  manufacturer?: string;
  countryOfOrigin?: string;
  dosage?: string;
  packageSize?: string;
  form?: string;
  activeSubstance?: string;
  prescriptionType?: string;
  fullDescription?: string;
  pharmacyComment?: string;
  additionalFiles?: ProductRequestFile[];
  rejectionReason?: string;

  history?: Array<{
    id: string;
    status: ProductRequestStatus;
    title: string;
    description: string;
    createdAt: ISODateTimeString;
    isInferred: boolean;
  }>;

  commentsTotal?: number;
};

//===============================================================

export type ProductRequestsResponseDto = {
  items: ProductRequestResponseDto[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  earliestCreatedAt: CalendarDateString | null;
};
