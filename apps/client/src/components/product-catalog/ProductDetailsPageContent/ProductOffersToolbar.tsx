'use client';

import { ChevronDown, ChevronUp, Filter } from 'lucide-react';

import {
  SearchInput,
  SearchableSelect,
  SelectField,
} from '@e-pharmacy/ui/forms';

import { USER_SEARCH_MAX_LENGTH } from '@e-pharmacy/validation/url';

import {
  PRODUCT_OFFER_SORT_OPTIONS,
  type ProductOfferSort,
} from '@/components/product-catalog/config/product-offers';

import css from './ProductOffersToolbar.module.css';

//===================================================================

export type ProductOffersToolbarProps = Readonly<{
  isOpen: boolean;
  pharmacyNameQuery: string;
  pharmacyAddressQuery: string;
  cityFilter: string;
  cityOptions: readonly Readonly<{ value: string; label: string }>[];
  offerSort: ProductOfferSort;
  sanitizeSearchValue: (value: string) => string;
  onToggle: () => void;
  onPharmacyNameChange: (value: string) => void;
  onPharmacyAddressChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onSortChange: (value: ProductOfferSort) => void;
}>;

//===================================================================

export function ProductOffersToolbar({
  isOpen,
  pharmacyNameQuery,
  pharmacyAddressQuery,
  cityFilter,
  cityOptions,
  offerSort,
  sanitizeSearchValue,
  onToggle,
  onPharmacyNameChange,
  onPharmacyAddressChange,
  onCityChange,
  onSortChange,
}: ProductOffersToolbarProps) {
  return (
    <>
      <button
        className={css.toggle}
        type="button"
        aria-expanded={isOpen}
        aria-controls="product-offer-filters"
        onClick={onToggle}
      >
        <span className={css.toggleText}>
          <Filter size={18} aria-hidden="true" />
          {isOpen ? 'Hide filters' : 'Show filters'}
        </span>

        {isOpen ? (
          <ChevronUp size={18} aria-hidden="true" />
        ) : (
          <ChevronDown size={18} aria-hidden="true" />
        )}
      </button>

      <div
        className={
          isOpen ? `${css.controls} ${css.controlsOpen}` : css.controls
        }
        id="product-offer-filters"
        aria-label="Filter pharmacy offers"
      >
        <SearchInput
          id="pharmacy-name-search"
          label="Search by pharmacy"
          value={pharmacyNameQuery}
          placeholder="Enter pharmacy name"
          maxLength={USER_SEARCH_MAX_LENGTH}
          sanitizeValue={sanitizeSearchValue}
          onChange={onPharmacyNameChange}
        />

        <SearchInput
          id="pharmacy-address-search"
          label="Search by address"
          value={pharmacyAddressQuery}
          placeholder="Enter city or address"
          maxLength={USER_SEARCH_MAX_LENGTH}
          sanitizeValue={sanitizeSearchValue}
          onChange={onPharmacyAddressChange}
        />

        <SearchableSelect
          id="pharmacy-city-filter"
          label="City"
          value={cityFilter}
          options={[...cityOptions]}
          placeholder="All cities"
          isActive={cityFilter !== 'all'}
          sanitizeQuery={sanitizeSearchValue}
          onChange={onCityChange}
        />

        <SelectField
          id="pharmacy-sort"
          label="Sort by"
          value={offerSort}
          options={PRODUCT_OFFER_SORT_OPTIONS}
          onChange={onSortChange}
        />
      </div>
    </>
  );
}
