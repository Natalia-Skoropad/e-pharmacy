'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { LoaderCircle, Search, X } from 'lucide-react';
import clsx from 'clsx';

import { useOutsidePointerDown } from '@e-pharmacy/hooks/dom';
import { useDebouncedValue } from '@e-pharmacy/hooks/timing';
import type { AdminPharmacyOwnerPharmacySummary } from '@e-pharmacy/types/admin';
import { formatInitials } from '@e-pharmacy/ui/data-display';
import { TableImagePreview } from '@e-pharmacy/ui/media';

import { getAdminPharmacyOwnerPharmacies } from '@/lib/api/browser/admin-pharmacy-owners.api';

import css from '../PharmacyOwnerSearch/PharmacyOwnerSearch.module.css';

//===================================================================

type LinkedPharmacySearchProps = Readonly<{
  ownerId: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onSelect: (pharmacy: AdminPharmacyOwnerPharmacySummary) => void;
}>;

//===================================================================

function sanitizeSearch(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 120);
}

//===================================================================

export function LinkedPharmacySearch({
  ownerId,
  value,
  disabled = false,
  onChange,
  onSelect,
}: LinkedPharmacySearchProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const [suggestionsResult, setSuggestionsResult] = useState<Readonly<{
    query: string;
    items: readonly AdminPharmacyOwnerPharmacySummary[];
    unavailable: boolean;
  }> | null>(null);

  const [activeIndex, setActiveIndex] = useState(-1);
  const debouncedValue = useDebouncedValue(value.trim(), 250);

  const hasCurrentSuggestions =
    Boolean(debouncedValue) && suggestionsResult?.query === debouncedValue;

  const items = hasCurrentSuggestions ? suggestionsResult.items : [];
  const isLoading = Boolean(debouncedValue) && !hasCurrentSuggestions;

  const suggestionsUnavailable = hasCurrentSuggestions
    ? suggestionsResult.unavailable
    : false;

  useOutsidePointerDown({
    refs: [rootRef],
    enabled: isOpen,
    onOutside: () => setIsOpen(false),
  });

  useEffect(() => {
    if (!debouncedValue) return;

    const controller = new AbortController();
    const query = debouncedValue;

    void getAdminPharmacyOwnerPharmacies(
      ownerId,
      { search: query, page: 1, perPage: 20 },
      { signal: controller.signal }
    )
      .then((response) => {
        if (controller.signal.aborted) return;

        setSuggestionsResult({
          query,
          items: response.items.slice(0, 8),
          unavailable: false,
        });

        setActiveIndex(response.items.length ? 0 : -1);
      })

      .catch(() => {
        if (controller.signal.aborted) return;
        setSuggestionsResult({ query, items: [], unavailable: true });
        setActiveIndex(-1);
      });

    return () => controller.abort();
  }, [debouncedValue, ownerId]);

  const listboxId = 'owner-linked-pharmacy-search-suggestions';
  const activeOption = activeIndex >= 0 ? items[activeIndex] : undefined;

  const activeOptionId = activeOption
    ? `${listboxId}-option-${activeOption.id}`
    : undefined;

  const statusText = useMemo(() => {
    if (isLoading) return 'Loading pharmacy suggestions...';
    if (suggestionsUnavailable) {
      return 'Suggestions are temporarily unavailable.';
    }

    if (debouncedValue && items.length === 0) {
      return 'No matching pharmacies found.';
    }

    return '';
  }, [debouncedValue, isLoading, items.length, suggestionsUnavailable]);

  const choosePharmacy = (pharmacy: AdminPharmacyOwnerPharmacySummary) => {
    onSelect(pharmacy);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      return;
    }

    if (!isOpen || items.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % items.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? items.length - 1 : index - 1));
      return;
    }

    if (event.key === 'Enter' && activeOption) {
      event.preventDefault();
      choosePharmacy(activeOption);
    }
  };

  return (
    <div className={css.field} ref={rootRef}>
      <label className={css.label} htmlFor="owner-linked-pharmacy-search">
        Pharmacy search
      </label>

      <div className={css.root}>
        <div
          className={clsx(
            css.inputWrap,
            value && css.inputWrapActive,
            disabled && css.inputWrapDisabled
          )}
        >
          <Search className={css.searchIcon} size={18} aria-hidden="true" />

          <input
            ref={inputRef}
            id="owner-linked-pharmacy-search"
            className={css.input}
            type="search"
            role="combobox"
            value={value}
            placeholder="ID, name, phone, email, or address"
            autoComplete="off"
            maxLength={120}
            disabled={disabled}
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls={isOpen ? listboxId : undefined}
            aria-activedescendant={isOpen ? activeOptionId : undefined}
            onFocus={() => {
              if (value.trim()) setIsOpen(true);
            }}
            onChange={(event) => {
              const nextValue = sanitizeSearch(event.target.value);
              onChange(nextValue);
              setIsOpen(Boolean(nextValue.trim()));
              setActiveIndex(-1);
            }}
            onKeyDown={handleKeyDown}
          />

          {isLoading ? (
            <LoaderCircle
              className={css.spinner}
              size={18}
              aria-hidden="true"
            />
          ) : value ? (
            <button
              className={css.clearButton}
              type="button"
              disabled={disabled}
              aria-label="Clear linked pharmacy search"
              onClick={() => {
                onChange('');
                setSuggestionsResult(null);
                setActiveIndex(-1);
                setIsOpen(false);
                inputRef.current?.focus();
              }}
            >
              <X size={16} aria-hidden="true" />
            </button>
          ) : (
            <span className={css.trailingSpace} aria-hidden="true" />
          )}
        </div>

        {isOpen ? (
          <div className={css.suggestionsPanel}>
            {items.length > 0 ? (
              <ul
                className={css.suggestions}
                id={listboxId}
                role="listbox"
                aria-label="Linked pharmacy suggestions"
              >
                {items.map((pharmacy, index) => (
                  <li
                    className={clsx(
                      css.suggestion,
                      index === activeIndex && css.suggestionActive
                    )}
                    id={`${listboxId}-option-${pharmacy.id}`}
                    key={pharmacy.id}
                    role="option"
                    aria-selected={index === activeIndex}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => choosePharmacy(pharmacy)}
                  >
                    <TableImagePreview
                      src={pharmacy.imageUrl}
                      alt={`${pharmacy.name} photo`}
                      fallback={formatInitials(pharmacy.name, 'P')}
                      size={34}
                    />

                    <span className={css.suggestionCopy}>
                      <strong className={css.suggestionName}>
                        {pharmacy.name}
                      </strong>
                      <span className={css.suggestionMeta}>
                        {[pharmacy.email, pharmacy.phone]
                          .filter(Boolean)
                          .join(' · ') || pharmacy.id}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : statusText ? (
              <p className={css.suggestionState} role="status">
                {statusText}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default LinkedPharmacySearch;
