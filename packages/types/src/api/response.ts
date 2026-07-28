import type { EntityId } from '../primitives';

//===================================================================

export type FavoriteIdsResponse = Readonly<{
  ids: readonly EntityId[];
}>;

export type FavoriteMutationResponse = Readonly<{
  isFavorite: boolean;
  message: string;
}>;
