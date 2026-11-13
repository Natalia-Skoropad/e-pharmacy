'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building2, Search } from 'lucide-react';

import { useDebouncedValue } from '@e-pharmacy/hooks/timing';
import type { OwnedPharmacyOption } from '@e-pharmacy/types/pharmacies';

import { formatInitials } from '@e-pharmacy/ui/data-display';
import { TableImagePreview } from '@e-pharmacy/ui/media';
import { InfoTooltip } from '@e-pharmacy/ui/overlays';

import {
  SearchableSelect,
  type SearchableSelectOption,
} from '@e-pharmacy/ui/forms';

import { formatPharmacyLocation } from '@e-pharmacy/utils';

import { getOwnedPharmacyOptions } from '@/lib/api/browser/owned-pharmacy-registry.api';

//===================================================================

type OwnedPharmacySearchProps = Readonly<{
  value: string;
  disabled?: boolean;
  onChange: (pharmacyId: string) => void;

  loadOptions?: (
    query: string,
    signal: AbortSignal
  ) => Promise<readonly OwnedPharmacyOption[]>;

  id?: string;
  label?: string;
  explainStatistics?: boolean;
  statisticsContext?: 'products' | 'orders';
  isOptionsLoading?: boolean;
}>;

//===================================================================

function sanitizeSearch(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 120);
}

//===================================================================

function toOption(
  pharmacy: OwnedPharmacyOption
): SearchableSelectOption<string> {
  const name = pharmacy.name?.trim() || `Pharmacy #${pharmacy.id}`;

  return {
    value: pharmacy.id,
    label: name,

    leading: (
      <TableImagePreview
        src={pharmacy.imageUrl}
        alt={`${name} photo`}
        fallback={formatInitials(name, 'P')}
        size={30}
      />
    ),

    searchText: [
      pharmacy.id,
      pharmacy.email,
      pharmacy.phone,
      formatPharmacyLocation(pharmacy.location),
    ]
      .filter(Boolean)
      .join(' '),
  };
}

//===================================================================

export function OwnedPharmacySearch({
  value,
  disabled = false,
  onChange,
  loadOptions,
  id = 'owned-pharmacy-registry-search',
  label = 'Pharmacy search',
  explainStatistics = false,
  statisticsContext = 'products',
  isOptionsLoading = false,
}: OwnedPharmacySearchProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), 250);

  const [suggestions, setSuggestions] = useState<Readonly<{
    query: string;
    items: readonly OwnedPharmacyOption[];
    unavailable: boolean;
  }> | null>(null);

  const [selected, setSelected] = useState<Readonly<{
    value: string;
    pharmacy: OwnedPharmacyOption | null;
  }> | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const requestQuery = debouncedQuery;

    void (
      loadOptions
        ? loadOptions(requestQuery, controller.signal).then((items) => ({
            items,
          }))
        : getOwnedPharmacyOptions(
            { search: requestQuery, limit: 20 },
            { signal: controller.signal }
          )
    )
      .then((result) => {
        if (!controller.signal.aborted)
          setSuggestions({
            query: requestQuery,
            items: result.items,
            unavailable: false,
          });
      })

      .catch(() => {
        if (!controller.signal.aborted)
          setSuggestions({ query: requestQuery, items: [], unavailable: true });
      });

    return () => controller.abort();
  }, [debouncedQuery, loadOptions]);

  // A deep link can select a pharmacy outside the first 20 suggestions.
  useEffect(() => {
    if (!value || selected?.value === value) return;

    const controller = new AbortController();

    void (
      loadOptions
        ? loadOptions(value, controller.signal).then((items) => ({ items }))
        : getOwnedPharmacyOptions(
            { search: value, limit: 20 },
            { signal: controller.signal }
          )
    )
      .then((result) => {
        if (!controller.signal.aborted)
          setSelected({
            value,
            pharmacy: result.items.find((item) => item.id === value) ?? null,
          });
      })

      .catch(() => {
        if (!controller.signal.aborted) setSelected({ value, pharmacy: null });
      });

    return () => controller.abort();
  }, [loadOptions, selected?.value, value]);

  const currentSuggestions = suggestions?.query === debouncedQuery;

  const items = useMemo(
    () => (currentSuggestions ? (suggestions?.items ?? []) : []),
    [currentSuggestions, suggestions]
  );

  const options = useMemo<Array<SearchableSelectOption<string>>>(() => {
    const result = items.map(toOption);

    if (
      !query.trim() &&
      value &&
      !result.some((item) => item.value === value)
    ) {
      result.unshift(
        selected?.value === value && selected.pharmacy
          ? toOption(selected.pharmacy)
          : { value, label: value }
      );
    }

    if (!query.trim()) result.unshift({ value: '', label: 'All pharmacies' });

    return result;
  }, [items, query, selected, value]);

  return (
    <SearchableSelect
      id={id}
      label={label}
      labelAccessory={
        <InfoTooltip
          label="Pharmacy search help"
          title="Pharmacy search"
          icon={<Building2 size={20} aria-hidden="true" />}
          escapeOverflow
          preferTopLayer
          scrollable
          items={[
            {
              title: 'Search fields',
              description:
                'Find a pharmacy by ID, name, email, phone, street address, settlement, or region.',
              icon: <Search size={17} aria-hidden="true" />,
            },

            ...(explainStatistics
              ? [
                  {
                    title: 'Statistics and products',
                    description:
                      statisticsContext === 'orders'
                        ? 'All pharmacies combines the orders and order statistics from every pharmacy you own. Select a pharmacy to see only its orders and statistics.'
                        : 'All pharmacies combines the stock, reservations and products of every pharmacy you own. Select a specific pharmacy to see statistics and inventory for that pharmacy only.',
                    icon: <Building2 size={17} aria-hidden="true" />,
                  },
                ]
              : []),
          ]}
        />
      }
      value={value}
      options={options}
      placeholder="Name, ID, email, phone, or address"
      emptyMessage={
        currentSuggestions && suggestions?.unavailable
          ? 'Suggestions are temporarily unavailable.'
          : 'No pharmacies found'
      }
      loadingMessage="Loading pharmacies..."
      isActive={Boolean(value)}
      isOptionsLoading={
        isOptionsLoading ||
        !currentSuggestions ||
        Boolean(value && selected?.value !== value)
      }
      filterOptions={false}
      disabled={disabled}
      maxLength={120}
      sanitizeQuery={sanitizeSearch}
      onQueryChange={setQuery}
      onChange={(nextValue) => {
        if (!nextValue) {
          setSelected(null);
          onChange('');
          return;
        }

        const pharmacy = items.find((item) => item.id === nextValue);

        if (pharmacy) setSelected({ value: nextValue, pharmacy });

        onChange(nextValue);
      }}
    />
  );
}

export default OwnedPharmacySearch;
