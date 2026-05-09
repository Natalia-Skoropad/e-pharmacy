import { Types } from 'mongoose';

import { API_MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/httpStatus';
import { Product } from '../models/product.model';
import { Store } from '../models/store.model';
import { httpError } from '../utils/httpError';

import type { StoreResponseDto } from '../types/store';

//===============================================================

type StoresQuery = {
  page: number;
  perPage: number;
  keyword?: string;
  nameKeyword?: string;
  addressKeyword?: string;
  city?: string;
  sort?: 'newest' | 'rating-desc' | 'rating-asc' | 'name-asc' | 'name-desc';
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
  createdAt: Date;
};

type StoreProductsCount = {
  _id: Types.ObjectId;
  count: number;
};

//===============================================================

function getSort(sort: StoresQuery['sort']): Record<string, 1 | -1> {
  switch (sort) {
    case 'rating-desc':
      return { rating: -1, name: 1 };

    case 'rating-asc':
      return { rating: 1, name: 1 };

    case 'name-asc':
      return { name: 1 };

    case 'name-desc':
      return { name: -1 };

    case 'newest':
    default:
      return { createdAt: -1 };
  }
}

function serializeStore(
  store: StoreDocument,
  productsCountMap = new Map<string, number>()
): StoreResponseDto {
  const storeId = store._id.toString();

  return {
    id: storeId,
    name: store.name,
    address: store.address,
    ...(store.city ? { city: store.city } : {}),
    ...(store.phone ? { phone: store.phone } : {}),
    ...(store.email ? { email: store.email } : {}),
    ...(typeof store.rating === 'number' ? { rating: store.rating } : {}),
    ...(store.imageUrl ? { imageUrl: store.imageUrl } : {}),
    ...(store.description ? { description: store.description } : {}),
    availableProductsCount: productsCountMap.get(storeId) ?? 0,
    isActive: store.isActive,
  };
}

async function getAvailableProductsCountMap(storeIds: Types.ObjectId[]) {
  if (storeIds.length === 0) return new Map<string, number>();

  const counts = await Product.aggregate<StoreProductsCount>([
    {
      $match: {
        offers: {
          $elemMatch: {
            storeId: { $in: storeIds },
            inStock: true,
            activeQuantity: { $gt: 0 },
          },
        },
      },
    },
    { $unwind: '$offers' },
    {
      $match: {
        'offers.storeId': { $in: storeIds },
        'offers.inStock': true,
        'offers.activeQuantity': { $gt: 0 },
      },
    },
    {
      $group: {
        _id: '$offers.storeId',
        count: { $sum: 1 },
      },
    },
  ]);

  return new Map(counts.map((item) => [item._id.toString(), item.count]));
}

//===============================================================

export async function getStoresService(query: StoresQuery) {
  const {
    page,
    perPage,
    keyword,
    nameKeyword,
    addressKeyword,
    city,
    sort,
  } = query;

  const filter: Record<string, unknown> = {
    isActive: true,
  };

  if (city) {
    filter.city = new RegExp(city, 'i');
  }

  if (nameKeyword) {
    filter.name = new RegExp(nameKeyword, 'i');
  }

  if (addressKeyword) {
    filter.address = new RegExp(addressKeyword, 'i');
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
      .sort(getSort(sort))
      .skip(skip)
      .limit(perPage)
      .lean<StoreDocument[]>(),
    Store.countDocuments(filter),
  ]);

  const productsCountMap = await getAvailableProductsCountMap(
    stores.map((store) => store._id)
  );

  return {
    items: stores.map((store) => serializeStore(store, productsCountMap)),
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

  const productsCountMap = await getAvailableProductsCountMap([store._id]);

  return {
    store: serializeStore(store, productsCountMap),
  };
}
