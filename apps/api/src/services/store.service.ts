import { Types } from 'mongoose';

import { API_MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';
import { Store } from '../models/store.model';
import { httpError } from '../utils/httpError';

import type { StoreResponseDto } from '../types/store';

//===============================================================

type StoresQuery = {
  page: number;
  perPage: number;
  keyword?: string;
  city?: string;
};

//===============================================================

type StoreDocument = {
  _id: Types.ObjectId;
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

//===============================================================

function serializeStore(store: StoreDocument): StoreResponseDto {
  return {
    id: store._id.toString(),
    name: store.name,
    address: store.address,
    ...(store.city ? { city: store.city } : {}),
    ...(store.phone ? { phone: store.phone } : {}),
    ...(store.email ? { email: store.email } : {}),
    ...(typeof store.rating === 'number' ? { rating: store.rating } : {}),
    ...(store.imageUrl ? { imageUrl: store.imageUrl } : {}),
    ...(store.description ? { description: store.description } : {}),
    isActive: store.isActive,
  };
}

//===============================================================

export async function getStoresService(query: StoresQuery) {
  const { page, perPage, keyword, city } = query;

  const filter: Record<string, unknown> = {
    isActive: true,
  };

  if (city) {
    filter.city = new RegExp(city, 'i');
  }

  if (keyword) {
    filter.$or = [
      { name: new RegExp(keyword, 'i') },
      { address: new RegExp(keyword, 'i') },
      { city: new RegExp(keyword, 'i') },
    ];
  }

  const skip = (page - 1) * perPage;

  const [stores, total] = await Promise.all([
    Store.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(perPage)
      .lean<StoreDocument[]>(),
    Store.countDocuments(filter),
  ]);

  return {
    items: stores.map(serializeStore),
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

//===============================================================

export async function getStoreDetailsService(storeId: string) {
  const store = await Store.findOne({
    _id: storeId,
    isActive: true,
  }).lean<StoreDocument | null>();

  if (!store) {
    throw httpError(HTTP_STATUS.NOT_FOUND, API_MESSAGES.STORE_NOT_FOUND);
  }

  return {
    store: serializeStore(store),
  };
}
