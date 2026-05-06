export type Store = {
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

//===================================================================

export type StoresResponse = {
  items: Store[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

//===================================================================

export type StoreDetailsResponse = {
  store: Store;
};
