import type { EntityId } from '../primitives';

//===================================================================

export type ApiSuccessResponse<TData = unknown> = Readonly<{
  status: 'success';
  message?: string;
  data: TData;
}>;

export type ApiEmptySuccessResponse = Readonly<{
  status: 'success';
  message?: string;
}>;

//===================================================================

export type FavoriteIdsResponse = Readonly<{
  ids: readonly EntityId[];
}>;

export type FavoriteMutationResponse = Readonly<{
  isFavorite: boolean;
  message: string;
}>;
