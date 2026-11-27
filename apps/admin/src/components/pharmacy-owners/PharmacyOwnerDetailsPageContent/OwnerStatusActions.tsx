'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Ban, ChevronDown, ClipboardCheck, ShieldCheck } from 'lucide-react';

import { Button } from '@e-pharmacy/ui/primitives';

import css from '../../pharmacies/PharmacyDetailsPageContent/PharmacyModerationActions.module.css';

//===================================================================

type Props = Readonly<{
  isDeactivateAction: boolean;
  disabled: boolean;
  onAction: () => void;
}>;

//===================================================================

/** Same status dropdown presentation as pharmacy moderation, without changing
 * the owner account mutation or its existing reason dialog. */
export function OwnerStatusActions({
  isDeactivateAction,
  disabled,
  onAction,
}: Props) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    const closeOutside = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        container.current?.querySelector('button')?.focus();
      }
    };

    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  return (
    <div className={css.menuWrapper} ref={container}>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={disabled}
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        iconLeft={<ClipboardCheck size={17} aria-hidden="true" />}
        onClick={() => setOpen((value) => !value)}
      >
        Manage owner status <ChevronDown size={16} aria-hidden="true" />
      </Button>
      {open ? (
        <div className={css.menu} id={menuId}>
          <div className={css.menuActionRow}>
            <button
              type="button"
              className={
                isDeactivateAction ? css.dangerAction : css.approveAction
              }
              disabled={disabled}
              onClick={() => {
                setOpen(false);
                onAction();
              }}
            >
              {isDeactivateAction ? (
                <Ban size={17} aria-hidden="true" />
              ) : (
                <ShieldCheck size={17} aria-hidden="true" />
              )}
              {isDeactivateAction ? 'Deactivate owner' : 'Activate owner'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
