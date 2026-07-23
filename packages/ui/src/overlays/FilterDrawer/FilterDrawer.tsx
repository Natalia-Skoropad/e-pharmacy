'use client';

import type { ReactNode } from 'react';

import CloseIconButton from '../../primitives/CloseIconButton/CloseIconButton';
import ResetFiltersButton from '../../primitives/ResetFiltersButton/ResetFiltersButton';
import ModalBase from '../ModalBase/ModalBase';
import ModalRoot from '../ModalRoot/ModalRoot';

import css from './FilterDrawer.module.css';

//===================================================================

export type FilterDrawerProps = Readonly<{
  id: string;
  eyebrow: string;
  children: ReactNode;
  title?: string;
  closeLabel?: string;
  resetLabel?: string;
  resetHref?: string;
  hasActiveFilters?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  onReset?: () => void;
}>;

//===================================================================

export function FilterDrawer({
  id,
  eyebrow,
  children,
  title = 'Filters',
  closeLabel = 'Close filters',
  resetLabel = 'Reset filters',
  resetHref,
  hasActiveFilters = false,
  isOpen = true,
  onClose,
  onReset,
}: FilterDrawerProps) {
  const titleId = `${id}-title`;

  if (!isOpen) return null;

  return (
    <ModalRoot>
      <ModalBase
        isOpen={isOpen}
        labelledBy={titleId}
        className={css.backdrop}
        dialogClassName={css.panel}
        onClose={onClose}
      >
        <div className={css.header}>
          <div>
            <p className={css.kicker}>{eyebrow}</p>
            <h2 className={css.title} id={titleId}>
              {title}
            </h2>
          </div>

          <CloseIconButton label={closeLabel} onClick={onClose} />
        </div>

        <div className={css.controls}>{children}</div>

        {hasActiveFilters && resetHref ? (
          <ResetFiltersButton
            className={css.resetButton}
            href={resetHref}
            label={resetLabel}
            onClick={onReset}
          />
        ) : null}
      </ModalBase>
    </ModalRoot>
  );
}
