'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { Button, ButtonLink, SearchInput, SelectField } from '@/components/common';

import { ROUTES } from '@/lib/constants/routes';
import {
  PRODUCT_AVAILABILITY_OPTIONS,
  PRODUCT_CATEGORY_OPTIONS,
  PRODUCT_SORT_OPTIONS,
  type MedicinesCatalogFilters,
  type ProductAvailabilityFilter,
  type ProductCategoryFilter,
  type ProductSortFilter,
} from '@/lib/catalog/medicines-catalog';

import css from './MedicinesCatalogFiltersForm.module.css';

//===================================================================

type MedicinesCatalogFiltersFormProps = {
  filters: MedicinesCatalogFilters;
};

//===================================================================

function buildCatalogHref(filters: Omit<MedicinesCatalogFilters, 'page'>) {
  const searchParams = new URLSearchParams();

  if (filters.storeId) searchParams.set('storeId', filters.storeId);
  if (filters.name) searchParams.set('name', filters.name);
  if (filters.article) searchParams.set('article', filters.article);
  if (filters.category !== 'all') searchParams.set('category', filters.category);
  if (filters.availability !== 'all') {
    searchParams.set('availability', filters.availability);
  }
  if (filters.sort !== 'newest') searchParams.set('sort', filters.sort);

  const queryString = searchParams.toString();

  return queryString
    ? `${ROUTES.MEDICINES_CATALOG}?${queryString}`
    : ROUTES.MEDICINES_CATALOG;
}

//===================================================================

function MedicinesCatalogFiltersForm({ filters }: MedicinesCatalogFiltersFormProps) {
  const router = useRouter();

  const [name, setName] = useState(filters.name);
  const [article, setArticle] = useState(filters.article);
  const [category, setCategory] = useState<ProductCategoryFilter>(
    filters.category
  );
  const [availability, setAvailability] =
    useState<ProductAvailabilityFilter>(filters.availability);
  const [sort, setSort] = useState<ProductSortFilter>(filters.sort);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    router.push(
      buildCatalogHref({
        name: name.trim(),
        article: article.trim(),
        category,
        availability,
        sort,
        storeId: filters.storeId,
      })
    );
  };

  return (
    <form className={css.filters} onSubmit={handleSubmit}>
      <div className={css.filtersGrid}>
        <SearchInput
          id="catalog-name-search"
          label="Search by name"
          value={name}
          placeholder="Product name"
          onChange={setName}
        />

        <SearchInput
          id="catalog-article-search"
          label="Search by article"
          value={article}
          placeholder="Article"
          onChange={setArticle}
        />

        <SelectField
          id="catalog-category"
          label="Category"
          value={category}
          options={[...PRODUCT_CATEGORY_OPTIONS]}
          onChange={setCategory}
        />

        <SelectField
          id="catalog-availability"
          label="Availability"
          value={availability}
          options={[...PRODUCT_AVAILABILITY_OPTIONS]}
          onChange={setAvailability}
        />

        <SelectField
          id="catalog-sort"
          label="Sort by"
          value={sort}
          options={[...PRODUCT_SORT_OPTIONS]}
          onChange={setSort}
        />
      </div>

      <div className={css.filterActions}>
        <Button type="submit">Apply filters</Button>

        <ButtonLink href={ROUTES.MEDICINES_CATALOG} variant="secondary">
          Reset filters
        </ButtonLink>
      </div>
    </form>
  );
}

export default MedicinesCatalogFiltersForm;
