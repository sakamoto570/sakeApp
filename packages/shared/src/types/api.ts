export type FlavorProfile = {
  fruity: number;
  mellow: number;
  rich: number;
  calm: number;
  dry: number;
  light: number;
};

export type SakeSearchResult = {
  sakeId: string;
  name: string;
};

export type SakeDetailResponse = {
  sakeId: string;
  name: string;
  breweryName?: string;
  flavor?: FlavorProfile;
};

export type SakeRecommendation = {
  sakeId: string;
  similarity: number;
  flavor: FlavorProfile;
  reason?: string;
};

export type CreateDrinkRequest = {
  sakeId: string;
  sakeNameSnapshot: string;
  breweryNameSnapshot?: string;
  flavorSnapshot?: FlavorProfile;
  imageUrl?: string;
  rating?: number;
  memo?: string;
  drankAt: string;
};

export type MySakeItem = {
  sakeId: string;
  sakeName: string;
  breweryName?: string;
  flavor?: FlavorProfile;
  imageUrl?: string;
  isFavorite: boolean;
  lastDrankAt: string;
};

export type CreateImageUploadUrlRequest = {
  fileName: string;
  contentType: string;
};

export type CreateImageUploadUrlResponse = {
  uploadUrl: string;
  imageUrl: string;
};

export type CreateImageViewUrlRequest = {
  imageUrl: string;
};

export type CreateImageViewUrlResponse = {
  viewUrl: string;
};

export type CreateFavoriteRequest = {
  sakeId: string;
  sakeNameSnapshot: string;
  breweryNameSnapshot?: string;
  flavorSnapshot?: FlavorProfile;
};

export type FavoriteItem = {
  sakeId: string;
  sakeName: string;
  breweryName?: string;
  flavor?: FlavorProfile;
  isFavorite: true;
  createdAt: string;
};

export type ErrorResponse = {
  message: string;
  code?: string;
};
