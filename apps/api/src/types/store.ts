import type { Types } from 'mongoose';

//===============================================================

export type StoreEntity = {
  name: string;
  address: string;
  city?: string;
  phone?: string;
  email?: string;
  rating?: number;
  imageUrl?: string;
  description?: string;
  isActive: boolean;
  ownerId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

//===============================================================

export type StoreResponseDto = {
  id: string;
  name: string;
  address: string;
  city?: string;
  phone?: string;
  email?: string;
  rating?: number;
  imageUrl?: string;
  description?: string;
  isActive: boolean;
};
