import type { Types } from 'mongoose';

import type { PRODUCT_REQUEST_STATUSES } from '../constants/product-request-validation';
import type { ProductCategory } from './categories';

//===============================================================

export type ProductRequestStatus = (typeof PRODUCT_REQUEST_STATUSES)[number];

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
  category: ProductCategory;
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
  createdAt: string;
  updatedAt?: string;
  requestNumber?: string;
  productId?: string;
  productImageUrl?: string;
  productArticle?: string;
  productName?: string;
  article: string;
  name: string;
  category: ProductCategory;
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
    createdAt: string;
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
  earliestCreatedAt: string | null;
};
