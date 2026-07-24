import type { EntityId } from '../primitives';

//===================================================================

export type ApiSuccessResponse<TData = unknown> = {
  status: 'success';
  message?: string;
  data: TData;
};

export type ApiEmptySuccessResponse = {
  status: 'success';
  message?: string;
};

//===================================================================

export type MutationResponse = { message: string };
export type FavoriteIdsResponse = { ids: EntityId[] };

export type FavoriteMutationResponse = {
  isFavorite: boolean;
  message: string;
};
