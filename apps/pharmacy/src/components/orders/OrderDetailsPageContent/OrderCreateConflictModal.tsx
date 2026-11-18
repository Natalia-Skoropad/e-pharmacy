'use client';

import Link from 'next/link';
import { useId } from 'react';

import {
  AlertTriangle,
  ExternalLink,
  PencilLine,
  RefreshCw,
} from 'lucide-react';

import { ModalBase, ModalRoot } from '@e-pharmacy/ui/overlays';
import { Button, CloseIconButton } from '@e-pharmacy/ui/primitives';
import { TableImagePreview } from '@e-pharmacy/ui/media';
import { formatInitials } from '@e-pharmacy/ui/data-display';

import type { PharmacyOrderItem } from '@/lib/orders/orders';
import { getPharmacyProductPath } from '@/lib/routes';
import { getProductImageSrc } from '@/lib/products/product-images';

import css from './OrderCreateConflictModal.module.css';

//===================================================================

export type OrderCreateConflictDetail = Readonly<{
  productId: PharmacyOrderItem['productId'];
  productOfferId: PharmacyOrderItem['productOfferId'];
  name: string;
  imageUrl?: string;
  messages: readonly string[];
}>;

export type OrderCreateConflict = Readonly<{
  kind: 'stock' | 'price';
  details: readonly OrderCreateConflictDetail[];
  refreshedItems: PharmacyOrderItem[] | null;
}>;

type OrderCreateConflictModalProps = Readonly<{
  conflict: OrderCreateConflict | null;
  onConfirm: () => void;
  onCancel: () => void;
}>;

//===================================================================

export function OrderCreateConflictModal({
  conflict,
  onConfirm,
  onCancel,
}: OrderCreateConflictModalProps) {
  const titleId = useId();
  const noticeId = useId();

  if (!conflict) return null;

  const isPriceUpdate = conflict.kind === 'price';

  return (
    <ModalRoot>
      <ModalBase
        isOpen
        labelledBy={titleId}
        describedBy={noticeId}
        dialogClassName={css.scrollableDialog}
        onClose={onCancel}
      >
        <div className={css.content}>
          <div className={css.header}>
            <div className={css.heading}>
              <p className={css.eyebrow}>
                {isPriceUpdate ? 'Price update' : 'Stock update'}
              </p>
              <h2 id={titleId} className={css.title}>
                {isPriceUpdate
                  ? 'Product prices have changed'
                  : 'Not enough products are available'}
              </h2>
            </div>
            <CloseIconButton
              label="Close order stock or price warning"
              onClick={onCancel}
            />
          </div>

          <section className={css.notice} id={noticeId}>
            <span className={css.noticeIcon} aria-hidden="true">
              <AlertTriangle size={18} />
            </span>
            <div className={css.noticeCopy}>
              <strong>
                {isPriceUpdate
                  ? 'Product prices changed'
                  : 'Available quantities changed'}
              </strong>
              <p>
                {isPriceUpdate
                  ? 'Prices changed while the order was being prepared. The server did not reserve any products. Review the current prices before trying again.'
                  : 'Another order may have reserved some of the requested products. No products were reserved for this order. Review the remaining quantities before trying again.'}
              </p>
            </div>
          </section>

          <section className={css.details} aria-label="Products to review">
            <h3 className={css.detailsTitle}>
              Products to review ({conflict.details.length})
            </h3>
            {conflict.details.length ? (
              <ul className={css.detailsList}>
                {conflict.details.map((detail) => (
                  <li key={detail.productOfferId} className={css.detailItem}>
                    <TableImagePreview
                      src={getProductImageSrc(detail.imageUrl)}
                      alt={`${detail.name} photo`}
                      fallback={formatInitials(detail.name, 'P')}
                      size={40}
                    />
                    <div className={css.productInfo}>
                      <Link
                        href={getPharmacyProductPath(detail.productId)}
                        className={css.productLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {detail.name}
                      </Link>
                      {detail.messages.map((message) => (
                        <p key={message}>{message}</p>
                      ))}
                    </div>
                    <Link
                      href={getPharmacyProductPath(detail.productId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={css.linkIcon}
                      aria-label={`Open ${detail.name} in a new tab`}
                    >
                      <ExternalLink size={16} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={css.detailsFallback}>
                There are no products in this draft to review.
              </p>
            )}
          </section>

          <div className={css.actions}>
            <Button
              type="button"
              iconLeft={<RefreshCw size={17} aria-hidden="true" />}
              onClick={onConfirm}
            >
              {conflict.refreshedItems ? 'Update order draft' : 'Review order'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              iconLeft={<PencilLine size={17} aria-hidden="true" />}
              onClick={onCancel}
            >
              Keep editing
            </Button>
          </div>
        </div>
      </ModalBase>
    </ModalRoot>
  );
}
