'use client';

import Link from 'next/link';

import {
  CirclePlus,
  CircleAlert,
  Info,
  MessageSquareText,
  Package,
  ShoppingCart,
  Trash2,
  Wallet,
} from 'lucide-react';

import { Button, SvgIcon } from '@e-pharmacy/ui/primitives';
import { LinkButton } from '@e-pharmacy/ui/navigation';
import { RatingSummary } from '@e-pharmacy/ui/data-display';
import { CategoryIcon, QuantityCounter } from '@e-pharmacy/ui/forms';
import { ShimmerImage } from '@e-pharmacy/ui/media';
import { ProfileResourceState } from '@e-pharmacy/ui/profile';
import { formatMoney } from '@e-pharmacy/utils/money';

import { getPharmacyProductPath } from '@/lib/routes';

import type {
  PharmacyOrderDetails,
  PharmacyOrderItem,
} from '@/lib/orders/orders';

import { getProductImageSrc } from '@/lib/products/product-images';

import css from './OrderDetailsPageContent.module.css';

//===================================================================

function formatAvailableItems(quantity: number): string {
  return quantity === 1 ? '1 item available' : `${quantity} items available`;
}

//===================================================================

function OrderProductCard({
  item,
  categoryIcons,
  verifiedAvailableStock,
  isEditable,
  isUpdating,
  onQuantityChange,
  onRemove,
}: Readonly<{
  item: PharmacyOrderItem;
  categoryIcons: Readonly<Record<string, string>>;
  verifiedAvailableStock?: number | null;
  isEditable: boolean;
  isUpdating: boolean;
  onQuantityChange: (item: PharmacyOrderItem, quantity: number) => void;
  onRemove: (item: PharmacyOrderItem) => void;
}>) {
  const imageSrc = getProductImageSrc(item.imageUrl);

  const stockQuantity =
    typeof verifiedAvailableStock === 'number'
      ? verifiedAvailableStock
      : item.quantity + (item.availableQuantity ?? 0);

  const availableQuantity =
    typeof verifiedAvailableStock === 'number'
      ? Math.max(0, verifiedAvailableStock - item.quantity)
      : (item.availableQuantity ?? 0);

  const hasStockWarning =
    verifiedAvailableStock === null ||
    (typeof verifiedAvailableStock === 'number' &&
      item.quantity > verifiedAvailableStock);

  return (
    <article
      className={css.itemCard}
      aria-labelledby={`order-product-${item.id}`}
    >
      <div className={css.itemImageWrap}>
        {imageSrc ? (
          <ShimmerImage
            className={css.itemImage}
            src={imageSrc}
            alt={item.name}
            sizes="(max-width: 767px) calc(100vw - 88px), 140px"
            unoptimized
          />
        ) : (
          <div className={css.itemFallback} aria-hidden="true">
            <SvgIcon name="icon-shopping-cart" size={28} />
          </div>
        )}
      </div>

      <div className={css.itemContent}>
        <div className={css.itemLeftColumn}>
          <div className={css.itemProductInfo}>
            {item.category ? (
              <p className={css.itemCategory}>
                <span className={css.categoryIcon} aria-hidden="true">
                  <CategoryIcon
                    name={categoryIcons[item.category.slug]}
                    size={16}
                  />
                </span>
                {item.category.name}
              </p>
            ) : null}

            <h3 className={css.itemTitle} id={`order-product-${item.id}`}>
              {item.name}
            </h3>

            <RatingSummary
              className={css.itemRating}
              rating={item.rating ?? 0}
              reviewsCount={item.reviewsCount ?? 0}
              size="sm"
            />
          </div>

          <div className={css.quantityBlock}>
            <QuantityCounter
              value={item.quantity}
              min={0}
              max={stockQuantity}
              disabled={!isEditable}
              isLoading={isUpdating}
              ariaLabel={`Quantity controls for ${item.name}`}
              onDecrement={() => onQuantityChange(item, item.quantity - 1)}
              onIncrement={() => onQuantityChange(item, item.quantity + 1)}
            />

            <p className={css.stockText}>
              {verifiedAvailableStock === null
                ? 'Availability not verified'
                : formatAvailableItems(availableQuantity)}
            </p>
          </div>
        </div>

        <div className={css.itemRightColumn}>
          <dl className={css.itemPrices}>
            <div className={css.totalPriceRow}>
              <dt>Total amount</dt>
              <dd>{formatMoney(item.totalPrice) ?? '—'}</dd>
            </div>
            <div className={css.unitPriceRow}>
              <dt>Unit price</dt>
              <dd>{formatMoney(item.unitPrice) ?? '—'}</dd>
            </div>
          </dl>

          {hasStockWarning ? (
            <p className={css.itemStockWarning} role="alert">
              <CircleAlert size={16} aria-hidden="true" />
              <span>
                {verifiedAvailableStock === null
                  ? 'Current stock could not be verified. Review availability before creating the order.'
                  : verifiedAvailableStock === 0
                    ? 'This product has been reserved by another order and is currently unavailable. Remove it to continue.'
                    : `Only ${verifiedAvailableStock} available. Decrease the quantity to continue.`}
              </span>
            </p>
          ) : null}

          <div className={css.itemActions}>
            <LinkButton
              href={getPharmacyProductPath(item.productId)}
              variant="secondary"
              size="sm"
              renderLink={({ href, className, children, ...props }) => (
                <Link href={href} className={className} {...props}>
                  {children}
                </Link>
              )}
            >
              <Info size={16} aria-hidden="true" />
              Details
            </LinkButton>

            <Button
              className={css.removeButton}
              type="button"
              size="sm"
              variant="ghost"
              disabled={!isEditable || isUpdating}
              onClick={() => onRemove(item)}
            >
              <Trash2 size={16} aria-hidden="true" />
              Remove
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

//===================================================================

export function OrderProductsTab({
  order,
  categoryIcons,
  verifiedDraftStock,
  isEditable,
  isUpdating,
  onQuantityChange,
  onRemoveProduct,
  onOpenProductModal,
}: Readonly<{
  order: PharmacyOrderDetails;
  categoryIcons: Readonly<Record<string, string>>;
  verifiedDraftStock: Readonly<Record<string, number | null>>;
  isEditable: boolean;
  isUpdating: boolean;
  onQuantityChange: (item: PharmacyOrderItem, quantity: number) => void;
  onRemoveProduct: (item: PharmacyOrderItem) => void;
  onOpenProductModal: () => void;
}>) {
  return (
    <div className={css.productsGrid}>
      <section className={css.itemsSection} aria-labelledby="order-items-title">
        <h2 id="order-items-title" className="visually-hidden">
          Products in this order
        </h2>
        <div className={css.itemsList}>
          {order.items.length > 0 ? (
            order.items.map((item) => (
              <OrderProductCard
                key={item.productOfferId}
                item={item}
                categoryIcons={categoryIcons}
                verifiedAvailableStock={verifiedDraftStock[item.productOfferId]}
                isEditable={isEditable}
                isUpdating={isUpdating}
                onQuantityChange={onQuantityChange}
                onRemove={onRemoveProduct}
              />
            ))
          ) : (
            <ProfileResourceState
              variant="empty"
              title="No products in this order yet"
              description="Click ‘Add more products’ to select an available product before saving the order."
              icon={<ShoppingCart size={23} aria-hidden="true" />}
              headingLevel={3}
            />
          )}
        </div>
      </section>

      <aside className={css.orderSummary} aria-labelledby="order-summary-title">
        <h2 className={css.summaryTitle} id="order-summary-title">
          Order summary
        </h2>

        <dl className={css.summaryListCompact}>
          <div>
            <dt>
              <Package size={17} aria-hidden="true" /> Items
            </dt>
            <dd>{order.totalQuantity}</dd>
          </div>

          <div>
            <dt>
              <Wallet size={17} aria-hidden="true" /> Total
            </dt>
            <dd>{formatMoney(order.totalAmount) ?? '—'}</dd>
          </div>
        </dl>

        <div className={css.clientComment}>
          <div className={css.clientCommentTitle}>
            <MessageSquareText size={18} aria-hidden="true" />
            <strong>Client comment</strong>
          </div>
          <p>{order.clientComment || 'Client did not leave a comment.'}</p>
        </div>

        <Button
          type="button"
          variant="primary"
          className={css.addMoreProductsButton}
          fullWidth
          disabled={!isEditable || isUpdating}
          onClick={onOpenProductModal}
        >
          <CirclePlus size={17} aria-hidden="true" />
          Add more products
        </Button>
      </aside>
    </div>
  );
}
