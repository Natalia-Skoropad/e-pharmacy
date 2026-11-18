'use client';

import Link from 'next/link';
import { useId } from 'react';

import {
  AlertTriangle,
  CircleCheckBig,
  ExternalLink,
  Minus,
  Trash2,
  X,
} from 'lucide-react';

import { formatInitials } from '@e-pharmacy/ui/data-display';
import { TableImagePreview } from '@e-pharmacy/ui/media';
import { ModalBase, ModalRoot } from '@e-pharmacy/ui/overlays';
import { Button, CloseIconButton } from '@e-pharmacy/ui/primitives';
import { formatMoney } from '@e-pharmacy/utils/money';

import type { PharmacyOrderItem } from '@/lib/orders/orders';
import { getProductImageSrc } from '@/lib/products/product-images';
import { getPharmacyProductPath } from '@/lib/routes';

import css from './OrderCreateConflictModal.module.css';

//===================================================================

export type OrderPriceChange = Readonly<{
  item: PharmacyOrderItem;
  action: 'increase' | 'decrease' | 'remove';
  nextQuantity?: number;
}>;

type OrderPriceChangeModalProps = Readonly<{
  change: OrderPriceChange | null;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}>;

//===================================================================

function getActionDescription(change: OrderPriceChange): string {
  const { action, item, nextQuantity } = change;

  if (action === 'remove') {
    return 'Are you sure you want to remove this product from the order? If you add it again, the updated price will apply.';
  }

  if (action === 'decrease') {
    return 'Are you sure you want to remove one unit? The remaining units keep their original price for now. If you increase the quantity again, the entire order line will use the new price.';
  }

  return `Increasing the quantity from ${item.quantity} to ${nextQuantity ?? item.quantity + 1} will use the current price for the updated order line.`;
}

//===================================================================

export function OrderPriceChangeModal({
  change,
  isLoading,
  onConfirm,
  onCancel,
}: OrderPriceChangeModalProps) {
  const titleId = useId();
  const noticeId = useId();

  if (!change) return null;

  const { item, action } = change;
  const isRemove = action === 'remove';

  const confirmLabel = isRemove
    ? 'Remove anyway'
    : action === 'decrease'
      ? 'Remove one unit'
      : 'Use current price';

  const cancelLabel = isRemove ? 'Keep product' : 'Keep current quantity';
  const productPath = getPharmacyProductPath(item.productId);

  return (
    <ModalRoot>
      <ModalBase
        isOpen
        labelledBy={titleId}
        describedBy={noticeId}
        dialogClassName={css.scrollableDialog}
        closeOnBackdrop={!isLoading}
        closeOnEscape={!isLoading}
        onClose={() => {
          if (!isLoading) onCancel();
        }}
      >
        <div className={css.content}>
          <div className={css.header}>
            <div className={css.heading}>
              <p className={css.eyebrow}>Price update</p>
              <h2 className={css.title} id={titleId}>
                Product price changed
              </h2>
            </div>
            <CloseIconButton
              label="Close price update warning"
              disabled={isLoading}
              onClick={onCancel}
            />
          </div>

          <section className={css.notice} id={noticeId}>
            <span className={css.noticeIcon} aria-hidden="true">
              <AlertTriangle size={18} />
            </span>
            <div className={css.noticeCopy}>
              <strong>Product price has changed</strong>
              <p>{getActionDescription(change)}</p>
            </div>
          </section>

          <section className={css.details} aria-label="Product price details">
            <h3 className={css.detailsTitle}>Affected product</h3>
            <div className={css.detailItem}>
              <TableImagePreview
                src={getProductImageSrc(item.imageUrl)}
                alt={`${item.name} photo`}
                fallback={formatInitials(item.name, 'P')}
                size={40}
              />
              <div className={css.productInfo}>
                <Link
                  href={productPath}
                  className={css.productLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.name}
                </Link>
                <p>
                  Previous price:{' '}
                  <strong>{formatMoney(item.unitPrice) ?? '—'}</strong>
                </p>
                <p>
                  Current price:{' '}
                  <strong>
                    {formatMoney(item.currentPrice ?? item.unitPrice) ?? '—'}
                  </strong>
                </p>
              </div>
              <Link
                href={productPath}
                target="_blank"
                rel="noopener noreferrer"
                className={css.linkIcon}
                aria-label={`Open ${item.name} in a new tab`}
              >
                <ExternalLink size={16} aria-hidden="true" />
              </Link>
            </div>
          </section>

          <div className={css.actions}>
            <Button
              type="button"
              className={isRemove ? css.destructiveAction : undefined}
              iconLeft={
                isRemove ? (
                  <Trash2 size={17} aria-hidden="true" />
                ) : action === 'decrease' ? (
                  <Minus size={17} aria-hidden="true" />
                ) : (
                  <CircleCheckBig size={17} aria-hidden="true" />
                )
              }
              isLoading={isLoading}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
            <Button
              type="button"
              variant="secondary"
              iconLeft={<X size={17} aria-hidden="true" />}
              disabled={isLoading}
              onClick={onCancel}
            >
              {cancelLabel}
            </Button>
          </div>
        </div>
      </ModalBase>
    </ModalRoot>
  );
}
