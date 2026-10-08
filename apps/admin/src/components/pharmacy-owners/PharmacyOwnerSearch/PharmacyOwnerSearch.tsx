'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, UserCog } from 'lucide-react';

import { useDebouncedValue } from '@e-pharmacy/hooks/timing';
import type { AdminPharmacyOwnerOption } from '@e-pharmacy/types/admin';
import { formatInitials } from '@e-pharmacy/ui/data-display';

import {
  SearchableSelect,
  type SearchableSelectOption,
} from '@e-pharmacy/ui/forms';

import { TableImagePreview } from '@e-pharmacy/ui/media';
import { InfoTooltip } from '@e-pharmacy/ui/overlays';

import { getAdminPharmacyOwnerOptions } from '@/lib/api/browser/admin-pharmacy-owners.api';

//===================================================================

type PharmacyOwnerSearchProps = Readonly<{
  value: string;
  disabled?: boolean;
  onChange: (ownerId: string) => void;
}>;

//===================================================================

function sanitizeSearch(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 120);
}

//===================================================================

function toSearchableOption(
  owner: AdminPharmacyOwnerOption
): SearchableSelectOption<string> {
  return {
    value: owner.id,
    label: owner.name,
    leading: (
      <TableImagePreview
        src={owner.pictureUrl}
        alt={`${owner.name} photo`}
        fallback={formatInitials(owner.name, 'O')}
        size={30}
      />
    ),
    searchText: [owner.id, owner.email, owner.phone].join(' '),
  };
}

//===================================================================

export function PharmacyOwnerSearch({
  value,
  disabled = false,
  onChange,
}: PharmacyOwnerSearchProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), 250);

  const [selectedOwnerResult, setSelectedOwnerResult] = useState<Readonly<{
    value: string;
    owner: AdminPharmacyOwnerOption | null;
  }> | null>(null);

  const [suggestionsResult, setSuggestionsResult] = useState<Readonly<{
    query: string;
    items: readonly AdminPharmacyOwnerOption[];
    unavailable: boolean;
  }> | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const requestQuery = debouncedQuery;

    void getAdminPharmacyOwnerOptions(
      {
        ...(requestQuery ? { search: requestQuery } : {}),
        limit: 20,
      },
      { signal: controller.signal }
    )
      .then((response) => {
        if (controller.signal.aborted) return;

        setSuggestionsResult({
          query: requestQuery,
          items: response.items,
          unavailable: false,
        });
      })
      .catch(() => {
        if (controller.signal.aborted) return;

        setSuggestionsResult({
          query: requestQuery,
          items: [],
          unavailable: true,
        });
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  useEffect(() => {
    if (!value || selectedOwnerResult?.value === value) return;

    const controller = new AbortController();

    void getAdminPharmacyOwnerOptions(
      { search: value, limit: 8 },
      { signal: controller.signal }
    )
      .then((response) => {
        if (controller.signal.aborted) return;

        setSelectedOwnerResult({
          value,
          owner: response.items.find((owner) => owner.id === value) ?? null,
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setSelectedOwnerResult({ value, owner: null });
        }
      });

    return () => controller.abort();
  }, [selectedOwnerResult?.value, value]);

  const selectedOwner =
    selectedOwnerResult?.value === value ? selectedOwnerResult.owner : null;

  const hasCurrentSuggestions = suggestionsResult?.query === debouncedQuery;
  const owners = hasCurrentSuggestions ? suggestionsResult.items : [];

  const isOptionsLoading =
    !hasCurrentSuggestions ||
    Boolean(value && selectedOwnerResult?.value !== value);

  const suggestionsUnavailable = Boolean(
    hasCurrentSuggestions && suggestionsResult.unavailable
  );

  const options = useMemo<Array<SearchableSelectOption<string>>>(() => {
    const ownerOptions = owners.map(toSearchableOption);

    if (
      !query.trim() &&
      selectedOwner &&
      value === selectedOwner.id &&
      !ownerOptions.some((option) => option.value === selectedOwner.id)
    ) {
      ownerOptions.unshift(toSearchableOption(selectedOwner));
    } else if (
      !query.trim() &&
      value &&
      selectedOwnerResult?.value === value &&
      !ownerOptions.some((option) => option.value === value)
    ) {
      ownerOptions.unshift({ value, label: value });
    }

    if (!query.trim()) {
      ownerOptions.unshift({ value: '', label: 'All pharmacy owners' });
    }

    return ownerOptions;
  }, [owners, query, selectedOwner, selectedOwnerResult?.value, value]);

  return (
    <SearchableSelect
      id="pharmacy-owner-search"
      label="Pharmacy owner search"
      labelAccessory={
        <InfoTooltip
          label="Pharmacy owner search help"
          title="Pharmacy owner search"
          icon={<UserCog size={20} aria-hidden="true" />}
          items={[
            {
              title: 'Search fields',
              description:
                'Find a pharmacy owner by their full name, account ID, email address, or phone number.',
              icon: <Search size={17} aria-hidden="true" />,
            },
          ]}
        />
      }
      value={value}
      options={options}
      placeholder="Name, ID, email, or phone"
      emptyMessage={
        suggestionsUnavailable
          ? 'Suggestions are temporarily unavailable.'
          : 'No pharmacy owners found'
      }
      loadingMessage="Loading pharmacy owners..."
      isActive={Boolean(value)}
      isOptionsLoading={isOptionsLoading}
      filterOptions={false}
      disabled={disabled}
      maxLength={120}
      sanitizeQuery={sanitizeSearch}
      onQueryChange={setQuery}
      onChange={(nextValue) => {
        if (!nextValue) {
          setSelectedOwnerResult(null);
          onChange('');
          return;
        }

        const owner = owners.find((item) => item.id === nextValue);
        if (owner) {
          setSelectedOwnerResult({ value: owner.id, owner });
        }
        onChange(nextValue);
      }}
    />
  );
}

export default PharmacyOwnerSearch;
