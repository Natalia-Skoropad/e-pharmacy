import type { Types } from 'mongoose';

import type { ProductCategory } from './categories';

//===============================================================

export type ProductRequestStatus =
  | 'draft'
  | 'new'
  | 'in_progress'
  | 'approved'
  | 'rejected';

//===============================================================

export type ProductRequestEntity = {
  pharmacyId: Types.ObjectId;
  name: string;
  article: string;
  category: ProductCategory;
  status: ProductRequestStatus;
  createdAt: Date;
  updatedAt: Date;
};

//===============================================================

export type ProductRequestResponseDto = {
  id: string;
  createdAt: string;
  updatedAt?: string;
  article: string;
  name: string;
  category: ProductCategory;
  status: ProductRequestStatus;
};

//===============================================================

export type ProductRequestsResponseDto = {
  items: ProductRequestResponseDto[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};
