export type ProductOfferSort =
  | 'newest'
  | 'price-asc'
  | 'price-desc'
  | 'rating-desc'
  | 'rating-asc'
  | 'name-asc'
  | 'name-desc';

//===================================================================

export const PRODUCT_OFFERS_PER_PAGE = 10;

//===================================================================

export const PRODUCT_OFFER_SORT_OPTIONS: {
  value: ProductOfferSort;
  label: string;
}[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'rating-desc', label: 'Rating: highest first' },
  { value: 'rating-asc', label: 'Rating: lowest first' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
];
