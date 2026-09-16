'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  CircleMinus,
  CirclePlus,
  Clock,
  History,
  Info,
  MapPin,
  Mail,
  Phone,
  MessageSquareText,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  Truck,
  UserRound,
  UsersRound,
  Wallet,
} from 'lucide-react';

import {
  DELIVERY_METHOD_LABELS,
  ORDER_STATUS_PRESENTATION,
  PAYMENT_METHOD_LABELS,
  PHARMACY_STATUS_PRESENTATION,
} from '@e-pharmacy/config/presentation';

import {
  Button,
  CopyButton,
  LazyLoadButton,
  LoadingSpinner,
  SvgIcon,
} from '@e-pharmacy/ui/primitives';

import { LinkButton } from '@e-pharmacy/ui/navigation';

import {
  CountLabel,
  RatingSummary,
  formatInitials,
} from '@e-pharmacy/ui/data-display';

import { InfoTooltip } from '@e-pharmacy/ui/overlays';

import {
  QuantityCounter,
  RadioOption,
  SearchableSelect,
} from '@e-pharmacy/ui/forms';

import { ShimmerImage, TableImagePreview } from '@e-pharmacy/ui/media';
import { Tabs, type TabItem } from '@e-pharmacy/ui/navigation';
import { AddressInput, NameInput, PhoneInput } from '@e-pharmacy/ui/forms';
import { ConfirmationModal } from '@e-pharmacy/ui/overlays';
import { useToast } from '@e-pharmacy/ui/feedback';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { StatusBadge, StatusBanner } from '@e-pharmacy/ui/statistics';
import { isApiError } from '@e-pharmacy/api-client/transport';

import type {
  DeliveryMethod,
  OrderStatus,
  UpdateOrderStatusPayload,
  PaymentMethod,
} from '@e-pharmacy/types/orders';

import type { ProductDetails } from '@e-pharmacy/types/products';
import { getOrderStatusTransitions } from '@e-pharmacy/config/orders';
import { PRODUCT_CATEGORY_LABELS } from '@e-pharmacy/config/presentation';
import { formatMoney } from '@e-pharmacy/utils/money';
import { formatDateTime } from '@e-pharmacy/utils/date';
import { getWorkingHoursDisplayItems } from '@e-pharmacy/validation/pharmacy';

import {
  USER_ADDRESS_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_PHONE_MAX_LENGTH,
  buildOrderRejectionReasonError,
  hasValidationErrors,
  normalizePhoneInput,
  validateOrderDeliveryForm,
  type OrderDeliveryFormErrors,
  type OrderDeliveryTouchedFields,
  type OrderDeliveryFormValues,
} from '@e-pharmacy/validation/order';

import {
  getPharmacyClientPath,
  getPharmacyOrderPath,
  getPharmacyProductPath,
} from '@/lib/routes';

import {
  createPharmacyOrder,
  createPharmacyOrderComment,
  deletePharmacyOrderComment,
  getPharmacyClients,
  getPharmacyOrderDetails,
  getPharmacyOrderComments,
  updatePharmacyOrder,
  updatePharmacyOrderStatus,
  type CreatePharmacyOrderPayload,
} from '@/lib/api/browser';

import type { PharmacyClientRow } from '@/lib/clients/clients';

import {
  type PharmacyOrderActivityHistoryItem,
  type PharmacyOrderDetails,
  type PharmacyOrderItem,
} from '@/lib/orders/orders';

import { getPharmacyCheckoutDetails } from '@/lib/api/browser/pharmacy.api';
import { dispatchPharmacyBreadcrumbLabel } from '@/lib/layout/breadcrumbs';
import { dispatchOrderCounterRefresh } from '@/lib/orders/order-counter-refresh';
import { getProductImageSrc } from '@/lib/products/product-images';
import { getSafeApiErrorMessage } from '@/lib/errors/get-safe-api-error-message';
import { getLockedFeatureBannerStatus } from '@/lib/pharmacies/current-pharmacy-status';
import { usePharmacyProfile } from '@/providers/PharmacyProfileProvider';

import { EntityComments } from '@/components/comments/EntityComments';
import { OrderCancellationModal } from '@/components/orders/OrderCancellationModal';
import { ProductPickerModal } from './ProductPickerModal';

import css from './OrderDetailsPageContent.module.css';

//===================================================================

type CreateOrderRequestState = Readonly<{
  clientRequestId: string;
  payloadKey: string;
}>;

type CreateOrderPayloadWithoutRequestId = Omit<
  CreatePharmacyOrderPayload,
  'clientRequestId'
>;

//===================================================================

function getCreateOrderPayloadKey(
  payload: CreateOrderPayloadWithoutRequestId
): string {
  return JSON.stringify({
    ...payload,
    items: [...payload.items].sort((left, right) =>
      left.productOfferId.localeCompare(right.productOfferId)
    ),
  });
}

//===================================================================

function createClientRequestId(): string {
  return globalThis.crypto.randomUUID();
}

//===================================================================

type OrderDetailsPageContentProps = Readonly<{
  orderId?: string;
  mode?: 'details' | 'create';
}>;

type PendingStatusChange = Readonly<{
  status: Extract<OrderStatus, 'in_progress' | 'successful' | 'rejected'>;
  rejectionReason?: string;
}>;

type PendingPriceQuantityChange = Readonly<{
  item: PharmacyOrderItem;
  quantity: number;
}>;

//===================================================================

type OrderTab = 'products' | 'delivery' | 'payment' | 'comment' | 'history';

//===================================================================

type OrderHistoryEntry =
  | Readonly<{
      id: string;
      occurredAt: string;
      kind: 'status';
      entry: PharmacyOrderDetails['statusHistory'][number];
    }>
  | Readonly<{
      id: string;
      occurredAt: string;
      kind: 'activity';
      entry: PharmacyOrderActivityHistoryItem;
    }>;

//===================================================================

const COMMENTS_PER_PAGE = 10;
const HISTORY_INITIAL_VISIBLE_COUNT = 10;
const HISTORY_LOAD_STEP = 5;

//===================================================================

function getOrderTabs(
  commentsCount: number,
  historyCount: number
): Array<TabItem<OrderTab>> {
  return [
    { value: 'products', label: 'Order products' },
    { value: 'delivery', label: 'Delivery method' },
    { value: 'payment', label: 'Payment method' },
    { value: 'comment', label: `Order comments (${commentsCount})` },
    { value: 'history', label: `Order history (${historyCount})` },
  ];
}

//===================================================================

function getStatusActionLabel(status: PendingStatusChange['status']) {
  if (status === 'in_progress') return 'Take into work';
  if (status === 'successful') return 'Confirm order';

  return 'Reject order';
}

//===================================================================

function getStatusModalText(status: PendingStatusChange['status']) {
  if (status === 'in_progress') {
    return {
      title: 'Take this order into work?',
      description:
        'The order will move to In progress. After that, you can edit products, delivery, payment, and manager comments.',
    };
  }

  if (status === 'successful') {
    return {
      title: 'Confirm order?',
      description:
        'The reserved products will be written off from stock. This status change cannot be reverted.',
    };
  }

  return {
    title: 'Reject order?',
    description:
      'The order will be rejected and reserved products will return to available stock. This status change cannot be reverted.',
  };
}

//===================================================================

function getProductOffer(product: ProductDetails, pharmacyId: string) {
  return product.offers.find((offer) => offer.pharmacyId === pharmacyId);
}

//===================================================================

function getOrderHistoryEntries(
  order: PharmacyOrderDetails
): OrderHistoryEntry[] {
  return [
    ...order.statusHistory.map((entry, index) => ({
      id: `status-${entry.status}-${entry.changedAt}-${index}`,
      occurredAt: entry.changedAt,
      kind: 'status' as const,
      entry,
    })),

    ...order.activityHistory.map((entry, index) => ({
      id: `activity-${entry.type}-${entry.occurredAt}-${entry.productOfferId}-${index}`,
      occurredAt: entry.occurredAt,
      kind: 'activity' as const,
      entry,
    })),
  ].sort(
    (first, second) =>
      new Date(second.occurredAt).getTime() -
      new Date(first.occurredAt).getTime()
  );
}

//===================================================================

function getOrderItemsPayload(items: PharmacyOrderItem[]) {
  return items.map((item) => ({
    productOfferId: item.productOfferId,
    quantity: item.quantity,
  }));
}

//===================================================================

function formatAvailableItems(quantity: number): string {
  return quantity === 1 ? '1 item available' : `${quantity} items available`;
}

//===================================================================

function getOrderFormState(order: PharmacyOrderDetails) {
  return {
    deliveryMethod: order.deliveryMethod,
    recipientName: order.recipientName ?? order.client,
    recipientPhone: order.recipientPhone ?? order.clientPhone ?? '',
    deliveryAddress: order.deliveryAddress ?? order.clientAddress ?? '',
    paymentMethod: order.paymentMethod,
  };
}

//===================================================================

function OrderProductCard({
  item,
  isEditable,
  isUpdating,
  onQuantityChange,
  onRemove,
}: Readonly<{
  item: PharmacyOrderItem;
  isEditable: boolean;
  isUpdating: boolean;
  onQuantityChange: (item: PharmacyOrderItem, quantity: number) => void;
  onRemove: (item: PharmacyOrderItem) => void;
}>) {
  const imageSrc = getProductImageSrc(item.imageUrl);
  const stockQuantity = item.quantity + (item.availableQuantity ?? 0);
  const availableQuantity = item.availableQuantity ?? 0;

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
        <div className={css.itemHead}>
          <div>
            {item.category ? (
              <p className={css.itemCategory}>
                {PRODUCT_CATEGORY_LABELS[item.category] ?? item.category}
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
        </div>

        <div className={css.itemFooter}>
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
              {formatAvailableItems(availableQuantity)}
            </p>
          </div>

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
              Remove
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

//===================================================================

function OrderProductsTab({
  order,
  isEditable,
  isUpdating,
  onQuantityChange,
  onRemoveProduct,
  onOpenProductModal,
}: Readonly<{
  order: PharmacyOrderDetails;
  isEditable: boolean;
  isUpdating: boolean;
  onQuantityChange: (item: PharmacyOrderItem, quantity: number) => void;
  onRemoveProduct: (item: PharmacyOrderItem) => void;
  onOpenProductModal: () => void;
}>) {
  return (
    <div className={css.productsGrid}>
      <section className={css.itemsSection} aria-labelledby="order-items-title">
        <div className={css.itemsList}>
          {order.items.length > 0 ? (
            order.items.map((item) => (
              <OrderProductCard
                key={item.productOfferId}
                item={item}
                isEditable={isEditable}
                isUpdating={isUpdating}
                onQuantityChange={onQuantityChange}
                onRemove={onRemoveProduct}
              />
            ))
          ) : (
            <div className={css.emptyProducts}>
              <ShoppingCart size={28} aria-hidden="true" />
              <div>
                <h2>No products in this order yet</h2>
                <p>
                  Click “Add more products” to select an available product
                  before saving the order.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <aside className={css.orderSummary} aria-labelledby="order-summary-title">
        <h2 className={css.summaryTitle} id="order-summary-title">
          Order summary
        </h2>

        <dl className={css.summaryListCompact}>
          <div>
            <dt>Items</dt>
            <dd>{order.totalQuantity}</dd>
          </div>

          <div>
            <dt>Total</dt>
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
          variant="ghost"
          fullWidth
          disabled={!isEditable || isUpdating}
          onClick={onOpenProductModal}
        >
          Add more products
        </Button>
      </aside>
    </div>
  );
}

//===================================================================

function DeliveryTab({
  order,
  isEditable,
  deliveryMethod,
  recipientName,
  recipientPhone,
  deliveryAddress,
  deliveryErrors,
  deliveryTouchedFields,
  isUpdating,
  onDeliveryMethodChange,
  onRecipientNameChange,
  onRecipientPhoneChange,
  onDeliveryAddressChange,
  onCopyValue,
  onSave,
}: Readonly<{
  order: PharmacyOrderDetails;
  isEditable: boolean;
  deliveryMethod: DeliveryMethod;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  deliveryErrors: OrderDeliveryFormErrors;
  deliveryTouchedFields: OrderDeliveryTouchedFields;
  isUpdating: boolean;
  onDeliveryMethodChange: (value: DeliveryMethod) => void;
  onRecipientNameChange: (value: string) => void;
  onRecipientPhoneChange: (value: string) => void;
  onDeliveryAddressChange: (value: string) => void;
  onCopyValue: (value: string, label: string) => void;
  onSave: () => void;
}>) {
  const workingHours =
    getWorkingHoursDisplayItems(order.pharmacyWorkingHours ?? '') ?? [];

  return (
    <section className={css.methodCard} aria-labelledby="delivery-title">
      <div className={css.methodHeader}>
        <h2 id="delivery-title">Delivery method</h2>

        <Button
          className={css.tabSaveButton}
          type="button"
          disabled={!isEditable || isUpdating}
          onClick={onSave}
        >
          Save delivery method
        </Button>
      </div>

      <div className={css.methodGrid}>
        <fieldset
          className={css.methodOptions}
          disabled={!isEditable || isUpdating}
        >
          <legend className="visually-hidden">Delivery method</legend>

          <RadioOption
            name="delivery-method"
            value="pickup"
            checked={deliveryMethod === 'pickup'}
            label={DELIVERY_METHOD_LABELS.pickup}
            disabled={!isEditable || isUpdating}
            onChange={onDeliveryMethodChange}
          />

          <RadioOption
            name="delivery-method"
            value="postal_delivery"
            checked={deliveryMethod === 'postal_delivery'}
            label={DELIVERY_METHOD_LABELS.postal_delivery}
            disabled={!isEditable || isUpdating}
            onChange={onDeliveryMethodChange}
          />
        </fieldset>

        <div className={css.methodDetailsPanel}>
          {deliveryMethod === 'pickup' ? (
            <div className={css.deliveryInfoCard}>
              <h3>Pharmacy details</h3>

              <ul className={css.deliveryIconList}>
                {order.pharmacyPhone ? (
                  <li>
                    <Phone size={18} aria-hidden="true" />
                    <a href={`tel:${order.pharmacyPhone}`}>
                      {order.pharmacyPhone}
                    </a>
                  </li>
                ) : null}

                {order.pharmacyEmail ? (
                  <li className={css.emailRow}>
                    <Mail size={18} aria-hidden="true" />
                    <span className={css.emailActions}>
                      <a href={`mailto:${order.pharmacyEmail}`}>
                        {order.pharmacyEmail}
                      </a>
                      <CopyButton
                        label={`Copy pharmacy email ${order.pharmacyEmail}`}
                        disabled={isUpdating}
                        onClick={() =>
                          onCopyValue(
                            order.pharmacyEmail ?? '',
                            'Pharmacy email'
                          )
                        }
                      />
                    </span>
                  </li>
                ) : null}

                <li>
                  <Clock size={18} aria-hidden="true" />
                  {workingHours.length > 0 ? (
                    <span className={css.workingHoursList}>
                      {workingHours.map((item) => (
                        <span key={item.day}>
                          <strong>{item.day}:</strong> {item.hours}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span>Working hours are not specified.</span>
                  )}
                </li>

                {order.pharmacyAddress ? (
                  <li>
                    <MapPin size={18} aria-hidden="true" />
                    <span>{order.pharmacyAddress}</span>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : (
            <div className={css.deliveryFields}>
              <div className={css.deliveryFieldsGrid}>
                <NameInput
                  id="recipient-name"
                  name="recipientName"
                  value={recipientName}
                  error={deliveryErrors.recipientName ?? ''}
                  isTouched={Boolean(deliveryTouchedFields.recipientName)}
                  maxLength={USER_NAME_MAX_LENGTH}
                  disabled={!isEditable || isUpdating}
                  onChange={(event) =>
                    onRecipientNameChange(event.target.value)
                  }
                />

                <PhoneInput
                  id="recipient-phone"
                  name="recipientPhone"
                  value={recipientPhone}
                  error={deliveryErrors.recipientPhone ?? ''}
                  isTouched={Boolean(deliveryTouchedFields.recipientPhone)}
                  maxLength={USER_PHONE_MAX_LENGTH}
                  disabled={!isEditable || isUpdating}
                  onChange={(event) =>
                    onRecipientPhoneChange(event.target.value)
                  }
                />

                <div className={css.deliveryFieldWide}>
                  <AddressInput
                    id="delivery-address"
                    name="deliveryAddress"
                    value={deliveryAddress}
                    error={deliveryErrors.deliveryAddress ?? ''}
                    isTouched={Boolean(deliveryTouchedFields.deliveryAddress)}
                    errorClassName={css.deliveryAddressError}
                    maxLength={USER_ADDRESS_MAX_LENGTH}
                    disabled={!isEditable || isUpdating}
                    onChange={(event) =>
                      onDeliveryAddressChange(event.target.value)
                    }
                  />
                </div>
              </div>

              <div className={css.deliveryNotes}>
                <div className={css.deliveryNoteCard}>
                  <Truck size={18} aria-hidden="true" />
                  <p>
                    After confirmation, the pharmacy will contact the client to
                    confirm or clarify the delivery address.
                  </p>
                </div>

                <div className={css.deliveryNoteCardAccent}>
                  <Info size={18} aria-hidden="true" />
                  <p>
                    Delivery is not included in the product price. The carrier
                    will announce the delivery cost separately.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

//===================================================================

function PaymentTab({
  order,
  paymentMethod,
  isEditable,
  isUpdating,
  onPaymentMethodChange,
  onCopyValue,
  onSave,
}: Readonly<{
  order: PharmacyOrderDetails;
  paymentMethod: PaymentMethod;
  isEditable: boolean;
  isUpdating: boolean;
  onPaymentMethodChange: (value: PaymentMethod) => void;
  onCopyValue: (value: string, label: string) => void;
  onSave: () => void;
}>) {
  const bankDetails = order.bankDetails;
  const bankRows = bankDetails
    ? ([
        ['Recipient name', bankDetails.recipientName],
        ['Tax ID / EDRPOU', bankDetails.taxId],
        ['IBAN', bankDetails.iban],
        ['Bank name', bankDetails.bankName],
        ['Payment purpose', bankDetails.paymentPurpose],
      ] as const)
    : [];

  return (
    <section className={css.methodCard} aria-labelledby="payment-title">
      <div className={css.methodHeader}>
        <h2 id="payment-title">Payment method</h2>

        <Button
          className={css.tabSaveButton}
          type="button"
          disabled={
            !isEditable ||
            isUpdating ||
            (paymentMethod === 'bank_transfer' && !bankDetails)
          }
          onClick={onSave}
        >
          Save payment method
        </Button>
      </div>

      <div className={css.methodGrid}>
        <fieldset
          className={css.methodOptions}
          disabled={!isEditable || isUpdating}
        >
          <legend className="visually-hidden">Payment method</legend>

          <RadioOption
            name="payment-method"
            value="cash"
            checked={paymentMethod === 'cash'}
            label={PAYMENT_METHOD_LABELS.cash}
            disabled={!isEditable || isUpdating}
            onChange={onPaymentMethodChange}
          />

          <RadioOption
            name="payment-method"
            value="bank_transfer"
            checked={paymentMethod === 'bank_transfer'}
            label={PAYMENT_METHOD_LABELS.bank_transfer}
            disabled={!isEditable || isUpdating || !bankDetails}
            onChange={onPaymentMethodChange}
          />
        </fieldset>

        <div className={css.methodDetailsPanel}>
          {paymentMethod === 'cash' ? (
            <div className={css.paymentInfoCard}>
              <Wallet size={20} aria-hidden="true" />
              <h3>Pay when everything is ready</h3>
              <p>
                Cash is paid during pickup or delivery. Please keep the order
                amount ready when the client receives the order.
              </p>
            </div>
          ) : (
            <div className={css.bankDetailsStack}>
              <div className={css.bankCard}>
                <h3>Bank details</h3>

                {bankDetails ? (
                  <dl className={css.bankList}>
                    {bankRows.map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>
                          <span>{value}</span>
                          <CopyButton
                            label={`Copy ${label} ${value}`}
                            disabled={isUpdating}
                            onClick={() => onCopyValue(value, label)}
                          />
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className={css.metaText}>
                    Bank transfer is unavailable because the pharmacy has not
                    provided bank details yet.
                  </p>
                )}
              </div>

              {bankDetails ? (
                <div className={css.emailNote}>
                  <Mail size={20} aria-hidden="true" />
                  <p>
                    After payment, the client should send the receipt to the
                    pharmacy email for faster processing.
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

//===================================================================

function ManagerCommentTab({
  orderId,
  totalComments,
  isEditable,
  onTotalChange,
}: Readonly<{
  orderId: string;
  totalComments: number;
  isEditable: boolean;
  onTotalChange: (total: number) => void;
}>) {
  return (
    <EntityComments
      entityKey={`order:${orderId}`}
      initialTotal={totalComments}
      isEditable={isEditable}
      placeholder="Write an internal comment for this order..."
      load={(page, options) =>
        getPharmacyOrderComments(
          orderId,
          { page, perPage: COMMENTS_PER_PAGE },
          options
        )
      }
      create={async (text) => {
        await createPharmacyOrderComment(orderId, text);
      }}
      remove={(id) => deletePharmacyOrderComment(orderId, id)}
      onTotalChange={onTotalChange}
    />
  );
}

//===================================================================

function getOrderActivityLabel(
  activity: PharmacyOrderActivityHistoryItem
): string {
  if (activity.type === 'product_added') return 'ProductDetails added';
  if (activity.type === 'product_removed') return 'ProductDetails removed';
  if (activity.type === 'quantity_increased') return 'Quantity increased';

  return 'Quantity decreased';
}

//===================================================================

function HistoryTab({
  historyEntries,
  rejectionReason,
}: Readonly<{
  historyEntries: OrderHistoryEntry[];
  rejectionReason?: string;
}>) {
  const [visibleCount, setVisibleCount] = useState(
    HISTORY_INITIAL_VISIBLE_COUNT
  );
  const visibleEntries = historyEntries.slice(0, visibleCount);

  return (
    <section className={css.methodCard} aria-labelledby="history-title">
      <div className={css.historyHeader}>
        <h2 id="history-title">Order history</h2>

        <CountLabel
          className={css.tabCountLabel}
          shown={visibleEntries.length}
          total={historyEntries.length}
          label="history events"
        />
      </div>

      <ol className={css.historyList}>
        {visibleEntries.map((historyEntry) => {
          if (historyEntry.kind === 'status') {
            const entry = historyEntry.entry;

            const toneClassName =
              entry.status === 'rejected'
                ? css.historyDanger
                : entry.status === 'in_progress'
                  ? css.historyWarning
                  : entry.status === 'new'
                    ? css.historyInfo
                    : undefined;

            return (
              <li key={historyEntry.id} className={toneClassName}>
                <History size={18} aria-hidden="true" />
                <div className={css.historyContent}>
                  <strong>
                    {ORDER_STATUS_PRESENTATION[entry.status].label}
                  </strong>

                  <time dateTime={entry.changedAt}>
                    {formatDateTime(entry.changedAt) ?? '—'}
                  </time>

                  {entry.comment ? <p>{entry.comment}</p> : null}
                  {entry.status === 'rejected' && rejectionReason ? (
                    <p className={css.historyRejectionReason}>
                      <b>Rejection reason:</b> {rejectionReason}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          }

          const activity = historyEntry.entry;
          const isIncrease = activity.quantityDelta > 0;

          const priceChanged =
            activity.previousUnitPrice !== activity.unitPrice;

          const ActivityIcon =
            activity.type === 'product_added'
              ? ShoppingCart
              : activity.type === 'product_removed'
                ? Trash2
                : isIncrease
                  ? CirclePlus
                  : CircleMinus;

          const activityToneClassName =
            activity.type === 'product_removed' ||
            activity.type === 'quantity_decreased'
              ? css.historyDanger
              : undefined;

          return (
            <li key={historyEntry.id} className={activityToneClassName}>
              <ActivityIcon size={18} aria-hidden="true" />
              <div className={css.historyContent}>
                <strong>{getOrderActivityLabel(activity)}</strong>
                <time dateTime={activity.occurredAt}>
                  {formatDateTime(activity.occurredAt) ?? '—'}
                </time>
                <p>
                  <b>{activity.productName}</b>: {activity.previousQuantity} →{' '}
                  {activity.quantity}{' '}
                  <span
                    className={
                      isIncrease ? css.historyIncrease : css.historyDecrease
                    }
                  >
                    ({activity.quantityDelta > 0 ? '+' : ''}
                    {activity.quantityDelta})
                  </span>
                </p>
                {priceChanged ? (
                  <p className={css.historyPriceChange}>
                    Unit price changed from{' '}
                    {formatMoney(activity.previousUnitPrice) ?? '—'} to{' '}
                    {formatMoney(activity.unitPrice) ?? '—'}.
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      <LazyLoadButton
        visibleCount={visibleEntries.length}
        totalCount={historyEntries.length}
        label="Show more history"
        onLoadMore={() =>
          setVisibleCount((current) => current + HISTORY_LOAD_STEP)
        }
      />
    </section>
  );
}

//===================================================================

function getOptionalClientValue(value: string): string | undefined {
  const normalized = value.trim();

  if (!normalized || normalized === 'Not specified' || normalized === '—') {
    return undefined;
  }

  return normalized;
}

//===================================================================

function recalculateDraftItems(
  items: PharmacyOrderItem[]
): Pick<PharmacyOrderDetails, 'items' | 'totalQuantity' | 'totalAmount'> {
  const normalizedItems = items.map((item) => ({
    ...item,
    totalPrice: item.quantity * item.unitPrice,
  }));

  return {
    items: normalizedItems,
    totalQuantity: normalizedItems.reduce(
      (total, item) => total + item.quantity,
      0
    ),
    totalAmount: normalizedItems.reduce(
      (total, item) => total + item.totalPrice,
      0
    ),
  };
}

//===================================================================

type OrderDetailsLoadError = Readonly<{
  title: string;
  message: string;
}>;

//===================================================================

function getOrderDetailsLoadError(
  error: unknown,
  isCreateMode: boolean
): OrderDetailsLoadError {
  if (isCreateMode) {
    return {
      title: 'Order could not be prepared',
      message: getSafeApiErrorMessage(
        error,
        'Could not prepare a new order. Please try again.'
      ),
    };
  }

  if (isApiError(error) && [400, 404, 422].includes(error.httpStatus ?? 0)) {
    return {
      title: 'Order not found',
      message: 'This order does not exist or the link is invalid.',
    };
  }

  if (isApiError(error) && error.httpStatus === 403) {
    return {
      title: 'Order is unavailable',
      message: 'You do not have access to this order.',
    };
  }

  return {
    title: 'Order could not be loaded',
    message: getSafeApiErrorMessage(
      error,
      'Could not load the order. Please try again.'
    ),
  };
}

//===================================================================

function OrderDetailsPageContent({
  orderId,
  mode = 'details',
}: OrderDetailsPageContentProps) {
  const router = useRouter();
  const toast = useToast();
  const isCreateMode = mode === 'create';
  const { profile: pharmacyProfile, isLoading: isProfileLoading } =
    usePharmacyProfile();

  const createLockedStatus = isCreateMode
    ? getLockedFeatureBannerStatus(pharmacyProfile?.status)
    : null;

  const [order, setOrder] = useState<PharmacyOrderDetails | null>(null);
  const [clients, setClients] = useState<PharmacyClientRow[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<OrderDetailsLoadError | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<OrderTab>('products');
  const [pendingStatus, setPendingStatus] =
    useState<PendingStatusChange | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isCreateConfirmationOpen, setIsCreateConfirmationOpen] =
    useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToRemove, setProductToRemove] =
    useState<PharmacyOrderItem | null>(null);

  const [pendingPriceQuantityChange, setPendingPriceQuantityChange] =
    useState<PendingPriceQuantityChange | null>(null);

  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>('pickup');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryTouchedFields, setDeliveryTouchedFields] =
    useState<OrderDeliveryTouchedFields>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const createOrderRequestRef = useRef<CreateOrderRequestState | null>(null);
  const resourceGenerationRef = useRef(0);

  useEffect(() => {
    if (isCreateMode && (isProfileLoading || createLockedStatus)) return;

    const generation = resourceGenerationRef.current + 1;
    resourceGenerationRef.current = generation;

    const controller = new AbortController();
    const requestOptions = { signal: controller.signal };

    async function loadPage() {
      try {
        if (isCreateMode) {
          if (!pharmacyProfile) {
            throw new Error('Pharmacy profile could not be loaded.');
          }

          const [clientsResponse, checkoutDetailsResponse] = await Promise.all([
            getPharmacyClients(
              { page: 1, perPage: 200, status: 'active' },
              requestOptions
            ),
            getPharmacyCheckoutDetails(pharmacyProfile.id, requestOptions),
          ]);

          if (
            controller.signal.aborted ||
            resourceGenerationRef.current !== generation
          ) {
            return;
          }

          const activeClients = clientsResponse.items.filter(
            (client) => client.status === 'active'
          );
          const defaultClient =
            activeClients.find((client) => client.isDefault) ??
            activeClients[0];

          if (!defaultClient) {
            throw new Error(
              'An active client is required before an order can be created.'
            );
          }

          const pharmacy = checkoutDetailsResponse.pharmacy;
          const clientPhone = getOptionalClientValue(defaultClient.phone);
          const clientAddress = getOptionalClientValue(defaultClient.address);
          const createdAt = new Date().toISOString();

          const draftOrder: PharmacyOrderDetails = {
            id: 'draft',
            orderNumber: 'Draft',
            orderDate: createdAt,
            pharmacyId: pharmacy.id,
            pharmacyName: pharmacy.name,
            client: defaultClient.name,
            clientId: defaultClient.id,
            clientPhotoUrl: defaultClient.photoUrl,
            ...(clientPhone ? { clientPhone } : {}),
            ...(clientAddress ? { clientAddress } : {}),
            deliveryMethod: 'pickup',
            paymentMethod: 'cash',
            clientComment: '',
            totalQuantity: 0,
            totalAmount: 0,
            status: 'in_progress',
            createdByType: 'manager',
            items: [],
            currency: '₴',
            statusHistory: [],
            activityHistory: [],
            managerCommentsCount: 0,
            ...(pharmacy.phone ? { pharmacyPhone: pharmacy.phone } : {}),
            ...([pharmacy.address, pharmacy.city].filter(Boolean).length
              ? {
                  pharmacyAddress: [pharmacy.address, pharmacy.city]
                    .filter(Boolean)
                    .join(', '),
                }
              : {}),
            ...(pharmacy.workingHours
              ? { pharmacyWorkingHours: pharmacy.workingHours }
              : {}),
            ...(pharmacy.email ? { pharmacyEmail: pharmacy.email } : {}),
            ...(pharmacy.bankDetails
              ? { bankDetails: pharmacy.bankDetails }
              : {}),
          };

          setClients(activeClients);
          setSelectedClientId(defaultClient.id);
          setOrder(draftOrder);
          setDeliveryMethod('pickup');
          setRecipientName(defaultClient.name);
          setRecipientPhone(clientPhone ?? '');
          setDeliveryAddress(clientAddress ?? '');
          setPaymentMethod('cash');
          setDeliveryTouchedFields({});
          return;
        }

        if (!orderId) {
          throw new Error('Order ID is required.');
        }

        const loadedOrder = await getPharmacyOrderDetails(
          orderId,
          requestOptions
        );

        if (
          !controller.signal.aborted &&
          resourceGenerationRef.current === generation
        ) {
          const formState = getOrderFormState(loadedOrder);

          setOrder(loadedOrder);
          setSelectedClientId(loadedOrder.clientId ?? '');
          setDeliveryMethod(formState.deliveryMethod);
          setRecipientName(formState.recipientName);
          setRecipientPhone(formState.recipientPhone);
          setDeliveryAddress(formState.deliveryAddress);
          setPaymentMethod(formState.paymentMethod);
          setDeliveryTouchedFields({});
        }
      } catch (loadError) {
        if (
          !controller.signal.aborted &&
          resourceGenerationRef.current === generation
        ) {
          setOrder(null);
          setLoadError(getOrderDetailsLoadError(loadError, isCreateMode));
        }
      } finally {
        if (
          !controller.signal.aborted &&
          resourceGenerationRef.current === generation
        ) {
          setIsLoading(false);
        }
      }
    }

    void loadPage();

    return () => {
      controller.abort();

      if (resourceGenerationRef.current === generation) {
        resourceGenerationRef.current += 1;
      }
    };
  }, [
    createLockedStatus,
    isCreateMode,
    isProfileLoading,
    orderId,
    pharmacyProfile,
  ]);

  useEffect(() => {
    if (isCreateMode || !order?.orderNumber) return;

    dispatchPharmacyBreadcrumbLabel(`Order ${order.orderNumber}`);
  }, [isCreateMode, order?.orderNumber]);

  const historyEntries = useMemo(
    () => (order ? getOrderHistoryEntries(order) : []),
    [order]
  );

  const orderTabs = useMemo(
    () => getOrderTabs(order?.managerCommentsCount ?? 0, historyEntries.length),
    [historyEntries.length, order?.managerCommentsCount]
  );

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId]
  );

  const clientOptions = useMemo(
    () =>
      clients.map((client) => ({
        value: client.id,
        label: client.isDefault
          ? `${client.name} — default client`
          : client.name,
        searchText: [client.id, client.email, client.phone, client.address]
          .filter(Boolean)
          .join(' '),
        leading: (
          <TableImagePreview
            src={getProductImageSrc(client.photoUrl ?? undefined)}
            alt={`${client.name} photo`}
            fallback={formatInitials(client.name, 'C')}
            size={30}
          />
        ),
      })),
    [clients]
  );

  const isEditable = isCreateMode || order?.status === 'in_progress';
  const isOrderBusy = isUpdatingOrder || isCreatingOrder;
  const statusModalText = pendingStatus
    ? getStatusModalText(pendingStatus.status)
    : null;

  const deliveryValues = useMemo<OrderDeliveryFormValues>(
    () => ({
      recipientName,
      recipientPhone,
      deliveryAddress,
      comment: '',
    }),
    [deliveryAddress, recipientName, recipientPhone]
  );

  const deliveryErrors = useMemo(
    () => validateOrderDeliveryForm(deliveryValues, deliveryMethod),
    [deliveryMethod, deliveryValues]
  );

  const statusActions = useMemo(() => {
    if (!order || isCreateMode) {
      return [] as Array<PendingStatusChange['status']>;
    }

    return getOrderStatusTransitions(order.status);
  }, [isCreateMode, order]);

  const syncOrderState = (updatedOrder: PharmacyOrderDetails) => {
    const formState = getOrderFormState(updatedOrder);

    setOrder(updatedOrder);
    setSelectedClientId(updatedOrder.clientId ?? '');
    setDeliveryMethod(formState.deliveryMethod);
    setRecipientName(formState.recipientName);
    setRecipientPhone(formState.recipientPhone);
    setDeliveryAddress(formState.deliveryAddress);
    setPaymentMethod(formState.paymentMethod);
  };

  const setDraftItems = (items: PharmacyOrderItem[]) => {
    setOrder((currentOrder) =>
      currentOrder
        ? {
            ...currentOrder,
            ...recalculateDraftItems(items),
          }
        : currentOrder
    );
  };

  const updateOrderDraft = async (
    payload: Parameters<typeof updatePharmacyOrder>[1]
  ): Promise<PharmacyOrderDetails | null> => {
    if (!order || isCreateMode) return order;

    const generation = resourceGenerationRef.current;
    setIsUpdatingOrder(true);

    try {
      const updatedOrder = await updatePharmacyOrder(order.id, payload);

      if (resourceGenerationRef.current !== generation) return null;

      syncOrderState(updatedOrder);
      toast.success('Order updated successfully.');

      return updatedOrder;
    } catch (updateError) {
      if (resourceGenerationRef.current !== generation) return null;

      toast.error(
        getSafeApiErrorMessage(
          updateError,
          'Could not update the order. Please try again.'
        )
      );

      return null;
    } finally {
      if (resourceGenerationRef.current === generation) {
        setIsUpdatingOrder(false);
      }
    }
  };

  const applyQuantityChange = (item: PharmacyOrderItem, quantity: number) => {
    if (!order || !isEditable || isOrderBusy) return;

    if (isCreateMode) {
      const physicalQuantity =
        item.quantity + Math.max(0, item.availableQuantity ?? 0);
      const nextItems = order.items
        .map((orderItem) =>
          orderItem.productOfferId === item.productOfferId
            ? {
                ...orderItem,
                quantity,
                availableQuantity: Math.max(0, physicalQuantity - quantity),
                totalPrice: quantity * orderItem.unitPrice,
              }
            : orderItem
        )
        .filter((orderItem) => orderItem.quantity > 0);

      setDraftItems(nextItems);
      return;
    }

    const nextItems = order.items
      .map((orderItem) =>
        orderItem.productOfferId === item.productOfferId
          ? { ...orderItem, quantity }
          : orderItem
      )
      .filter((orderItem) => orderItem.quantity > 0);

    void updateOrderDraft({ items: getOrderItemsPayload(nextItems) });
  };

  const handleQuantityChange = (item: PharmacyOrderItem, quantity: number) => {
    if (!order || !isEditable || isOrderBusy) return;

    if (!isCreateMode && quantity < 1 && order.items.length <= 1) {
      toast.error(
        'You cannot remove the whole order. Continue editing it or reject the order.'
      );
      return;
    }

    if (
      quantity > item.quantity &&
      item.currentPrice !== undefined &&
      item.currentPrice !== item.unitPrice
    ) {
      setPendingPriceQuantityChange({ item, quantity });
      return;
    }

    applyQuantityChange(item, quantity);
  };

  const handleRequestRemoveProduct = (item: PharmacyOrderItem) => {
    if (!order || !isEditable || isOrderBusy) return;

    if (!isCreateMode && order.items.length <= 1) {
      toast.error(
        'You cannot remove the whole order. Continue editing it or reject the order.'
      );
      return;
    }

    setProductToRemove(item);
  };

  const handleConfirmRemoveProduct = () => {
    const item = productToRemove;

    if (!item) return;

    setProductToRemove(null);
    handleQuantityChange(item, 0);
  };

  const handleAddProduct = async (product: ProductDetails): Promise<void> => {
    if (!order || !isEditable || isOrderBusy) return;

    const offer = getProductOffer(product, order.pharmacyId);

    if (!offer || offer.availableQuantity < 1) {
      toast.error('This product is out of stock in your pharmacy.');
      return;
    }

    const existingItem = order.items.find(
      (item) => item.productOfferId === offer.id
    );

    if (existingItem) {
      toast.error('This product is already added to the order.');
      return;
    }

    const nextItems: PharmacyOrderItem[] = [
      ...order.items,
      {
        id: offer.id,
        productId: product.id,
        productOfferId: offer.id,
        name: product.name,
        article: product.article,
        category: product.category,
        imageUrl: product.imageUrl,
        rating: product.rating,
        reviewsCount: product.reviewsCount,
        quantity: 1,
        unitPrice: offer.price,
        totalPrice: offer.price,
        availableQuantity: Math.max(0, offer.availableQuantity - 1),
        currentPrice: offer.price,
      },
    ];

    if (isCreateMode) {
      setDraftItems(nextItems);
      return;
    }

    await updateOrderDraft({ items: getOrderItemsPayload(nextItems) });
  };

  const handleClientChange = (clientId: string) => {
    const client = clients.find((item) => item.id === clientId);

    if (!client || client.status !== 'active') return;

    const clientPhone = getOptionalClientValue(client.phone);
    const clientAddress = getOptionalClientValue(client.address);

    setSelectedClientId(client.id);
    setRecipientName(client.name);
    setRecipientPhone(clientPhone ?? '');
    setDeliveryAddress(clientAddress ?? '');
    setDeliveryTouchedFields({});
    setOrder((currentOrder) =>
      currentOrder
        ? {
            ...currentOrder,
            client: client.name,
            clientId: client.id,
            clientPhotoUrl: client.photoUrl,
            ...(clientPhone ? { clientPhone } : { clientPhone: undefined }),
            ...(clientAddress
              ? { clientAddress }
              : { clientAddress: undefined }),
          }
        : currentOrder
    );
  };

  const handleDeliveryMethodChange = (value: DeliveryMethod) => {
    setDeliveryMethod(value);
    setDeliveryTouchedFields({});

    if (value !== 'postal_delivery' || !order) return;

    if (!recipientName.trim()) {
      setRecipientName(order.recipientName ?? order.client);
    }

    if (!recipientPhone.trim() && order.clientPhone) {
      setRecipientPhone(normalizePhoneInput(order.clientPhone));
    }

    if (!deliveryAddress.trim() && order.clientAddress) {
      setDeliveryAddress(order.clientAddress);
    }
  };

  const handleRecipientNameChange = (value: string) => {
    setRecipientName(value);
    setDeliveryTouchedFields((current) => ({
      ...current,
      recipientName: true,
    }));
  };

  const handleRecipientPhoneChange = (value: string) => {
    setRecipientPhone(normalizePhoneInput(value));
    setDeliveryTouchedFields((current) => ({
      ...current,
      recipientPhone: true,
    }));
  };

  const handleDeliveryAddressChange = (value: string) => {
    setDeliveryAddress(value);
    setDeliveryTouchedFields((current) => ({
      ...current,
      deliveryAddress: true,
    }));
  };

  const validateDelivery = (): boolean => {
    const nextErrors = validateOrderDeliveryForm(
      deliveryValues,
      deliveryMethod
    );

    if (!hasValidationErrors(nextErrors)) return true;

    setDeliveryTouchedFields((current) => ({
      ...current,
      ...Object.keys(nextErrors).reduce<OrderDeliveryTouchedFields>(
        (fields, field) => ({
          ...fields,
          [field as keyof OrderDeliveryFormValues]: true,
        }),
        {}
      ),
    }));
    toast.error('Please check the postal delivery fields.');
    return false;
  };

  const handleSaveDelivery = () => {
    if (!validateDelivery()) return;

    if (isCreateMode) {
      setOrder((currentOrder) =>
        currentOrder
          ? {
              ...currentOrder,
              deliveryMethod,
              ...(deliveryMethod === 'postal_delivery'
                ? {
                    recipientName: recipientName.trim(),
                    recipientPhone: normalizePhoneInput(recipientPhone),
                    deliveryAddress: deliveryAddress.trim(),
                  }
                : {
                    recipientName: undefined,
                    recipientPhone: undefined,
                    deliveryAddress: undefined,
                  }),
            }
          : currentOrder
      );
      toast.success('Delivery method saved in the order draft.');
      return;
    }

    const payload =
      deliveryMethod === 'pickup'
        ? { deliveryMethod }
        : {
            deliveryMethod,
            deliveryDetails: {
              recipientName: recipientName.trim(),
              recipientPhone: normalizePhoneInput(recipientPhone),
              address: deliveryAddress.trim(),
            },
          };

    void updateOrderDraft(payload);
  };

  const handleSavePayment = () => {
    if (paymentMethod === 'bank_transfer' && !order?.bankDetails) {
      toast.error('Bank details are not available for this pharmacy.');
      return;
    }

    if (isCreateMode) {
      setOrder((currentOrder) =>
        currentOrder ? { ...currentOrder, paymentMethod } : currentOrder
      );
      toast.success('Payment method saved in the order draft.');
      return;
    }

    void updateOrderDraft({ paymentMethod });
  };

  const handleCopyValue = async (value: string, label: string) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied.`);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}.`);
    }
  };

  const handleStatusClick = (status: PendingStatusChange['status']) => {
    if (status === 'rejected') {
      setRejectionReason('');
      setPendingStatus({ status });
      return;
    }

    setPendingStatus({ status });
  };

  const handleConfirmStatus = async () => {
    if (!order || !pendingStatus || isCreateMode) return;

    if (pendingStatus.status === 'rejected') {
      const rejectionReasonError =
        buildOrderRejectionReasonError(rejectionReason);

      if (rejectionReasonError) {
        toast.error(rejectionReasonError);
        return;
      }
    }

    const generation = resourceGenerationRef.current;
    setIsUpdatingStatus(true);

    try {
      let payload: UpdateOrderStatusPayload;

      if (pendingStatus.status === 'rejected') {
        payload = {
          status: 'rejected',
          rejectionReason: rejectionReason.trim(),
        };
      } else {
        payload = { status: pendingStatus.status };
      }

      const updatedOrder = await updatePharmacyOrderStatus(order.id, payload);

      if (resourceGenerationRef.current !== generation) return;

      syncOrderState(updatedOrder);
      dispatchOrderCounterRefresh();
      setPendingStatus(null);
      setRejectionReason('');
      toast.success('Order status updated successfully.');
    } catch (statusError) {
      if (resourceGenerationRef.current !== generation) return;

      toast.error(
        getSafeApiErrorMessage(
          statusError,
          'Could not update the order status. Please try again.'
        )
      );
    } finally {
      if (resourceGenerationRef.current === generation) {
        setIsUpdatingStatus(false);
      }
    }
  };

  const handleRequestCreateOrder = () => {
    if (!order || !selectedClientId) {
      toast.error('Select an active client for this order.');
      return;
    }

    if (order.items.length === 0) {
      setActiveTab('products');
      toast.error('Add at least one product before saving the order.');
      return;
    }

    if (!validateDelivery()) {
      setActiveTab('delivery');
      return;
    }

    if (paymentMethod === 'bank_transfer' && !order.bankDetails) {
      setActiveTab('payment');
      toast.error('Bank details are not available for this pharmacy.');
      return;
    }

    setIsCreateConfirmationOpen(true);
  };

  const handleConfirmCreateOrder = async () => {
    if (!order || !selectedClientId || !isCreateMode) return;

    const generation = resourceGenerationRef.current;
    setIsCreatingOrder(true);

    try {
      const payload: CreateOrderPayloadWithoutRequestId = {
        clientId: selectedClientId,
        items: getOrderItemsPayload(order.items),
        deliveryMethod,
        ...(deliveryMethod === 'postal_delivery'
          ? {
              deliveryDetails: {
                recipientName: recipientName.trim(),
                recipientPhone: normalizePhoneInput(recipientPhone),
                address: deliveryAddress.trim(),
              },
            }
          : {}),
        paymentMethod,
        comment: '',
      };

      const payloadKey = getCreateOrderPayloadKey(payload);
      let requestState = createOrderRequestRef.current;

      if (!requestState || requestState.payloadKey !== payloadKey) {
        requestState = {
          clientRequestId: createClientRequestId(),
          payloadKey,
        };
        createOrderRequestRef.current = requestState;
      }

      const createdOrder = await createPharmacyOrder({
        ...payload,
        clientRequestId: requestState.clientRequestId,
      });

      if (resourceGenerationRef.current !== generation) return;

      createOrderRequestRef.current = null;
      setIsCreateConfirmationOpen(false);
      dispatchOrderCounterRefresh();
      toast.success('Order created and moved to In progress.');
      router.replace(getPharmacyOrderPath(createdOrder.id));
    } catch (createError) {
      if (resourceGenerationRef.current !== generation) return;

      toast.error(
        getSafeApiErrorMessage(
          createError,
          'Could not create the order. Please try again.'
        )
      );
    } finally {
      if (resourceGenerationRef.current === generation) {
        setIsCreatingOrder(false);
      }
    }
  };

  if (isCreateMode && !isProfileLoading && createLockedStatus) {
    return (
      <main className={css.page} aria-labelledby="order-details-page-title">
        <section className={css.contentCard}>
          <div className={css.statusStack}>
            <PageHeader
              title="Create order"
              titleId="order-details-page-title"
              icon={<ShoppingBag size={23} aria-hidden="true" />}
            />
            <StatusBanner
              {...PHARMACY_STATUS_PRESENTATION[createLockedStatus]}
              title="Order creation is unavailable"
              message={
                createLockedStatus === 'on_verification'
                  ? 'Creating orders is paused while Admin verifies the pharmacy profile.'
                  : 'Creating orders becomes available after Admin verifies the pharmacy profile.'
              }
            />
          </div>
        </section>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className={css.page} aria-label="Loading order">
        <section className={css.contentCard}>
          <div className={css.loaderBox}>
            <LoadingSpinner
              label={isCreateMode ? 'Preparing order...' : 'Loading order...'}
            />
          </div>
        </section>
      </main>
    );
  }

  if (loadError || !order) {
    const errorDetails =
      loadError ??
      ({
        title: 'Order not found',
        message: 'This order does not exist or the link is invalid.',
      } satisfies OrderDetailsLoadError);

    return (
      <main className={css.page} aria-labelledby="order-details-page-title">
        <section className={css.contentCard}>
          <div className={css.statusStack}>
            <PageHeader
              title={errorDetails.title}
              titleId="order-details-page-title"
              icon={<ShoppingBag size={23} aria-hidden="true" />}
            />
            <StatusBanner
              tone="danger"
              label="Error"
              title={errorDetails.title}
              message={errorDetails.message}
            />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={css.page} aria-labelledby="order-details-page-title">
      <section className={`${css.contentCard} ${css.headerCard}`}>
        {isCreateMode ? (
          <div className={css.createHeader}>
            <div className={css.createTitle}>
              <PageHeader
                title="Create order"
                titleId="order-details-page-title"
                icon={<ShoppingBag size={23} aria-hidden="true" />}
              />
            </div>

            <div className={css.clientSelector}>
              <SearchableSelect
                id="manager-order-client"
                label="Client"
                labelAccessory={
                  <InfoTooltip
                    label="About client selection"
                    title="Client selection"
                    icon={<UsersRound size={20} aria-hidden="true" />}
                  >
                    Search active clients by name, ID, email, phone number, or
                    address. The default walk-in client is selected
                    automatically.
                  </InfoTooltip>
                }
                value={selectedClientId}
                options={clientOptions}
                placeholder="Search active client"
                emptyMessage="No active clients found"
                isActive={Boolean(selectedClientId)}
                describedBy="manager-order-client-hint"
                disabled={isCreatingOrder}
                onChange={handleClientChange}
              />
              <p
                className={css.clientSearchHint}
                id="manager-order-client-hint"
              >
                Search by client name, ID, email, phone number, or address.
              </p>
            </div>

            {selectedClient ? (
              <Link
                className={css.selectedClientPreview}
                href={getPharmacyClientPath(selectedClient.id)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${selectedClient.name} client details in a new tab`}
              >
                <TableImagePreview
                  src={getProductImageSrc(selectedClient.photoUrl ?? undefined)}
                  alt={`${selectedClient.name} photo`}
                  fallback={formatInitials(selectedClient.name, 'C')}
                  size={42}
                />
                <span>
                  <small>Selected client</small>
                  <strong>{selectedClient.name}</strong>
                </span>
              </Link>
            ) : null}

            <Button
              className={css.saveOrderButton}
              type="button"
              disabled={!selectedClientId || isCreatingOrder}
              isLoading={isCreatingOrder}
              onClick={handleRequestCreateOrder}
            >
              Save order
            </Button>
          </div>
        ) : (
          <div className={css.detailsHeader}>
            <div className={css.titleBlock}>
              <PageHeader
                title={`Order ${order.orderNumber}`}
                titleId="order-details-page-title"
                icon={<ShoppingBag size={23} aria-hidden="true" />}
              />
              <p className={css.metaText}>
                Created on {formatDateTime(order.orderDate) ?? '—'}
              </p>
            </div>

            <div className={css.clientStatusRow}>
              {order.clientId ? (
                <Link
                  className={css.orderClientLink}
                  href={getPharmacyClientPath(order.clientId)}
                >
                  <TableImagePreview
                    src={getProductImageSrc(order.clientPhotoUrl ?? undefined)}
                    alt={`${order.client} photo`}
                    fallback={
                      order.client ? (
                        formatInitials(order.client, 'C')
                      ) : (
                        <UserRound size={18} aria-hidden="true" />
                      )
                    }
                    size={38}
                  />
                  <span>
                    <small>Client</small>
                    <strong>{order.client}</strong>
                  </span>
                </Link>
              ) : null}

              <div
                className={`${css.statusActions} ${
                  order.status === 'in_progress'
                    ? css.statusActionsInProgress
                    : ''
                }`}
              >
                <StatusBadge {...ORDER_STATUS_PRESENTATION[order.status]} />

                {statusActions.map((status) => (
                  <Button
                    key={status}
                    type="button"
                    size="sm"
                    variant={status === 'rejected' ? 'secondary' : 'primary'}
                    className={
                      status === 'rejected' ? css.rejectButton : undefined
                    }
                    disabled={isUpdatingStatus || isUpdatingOrder}
                    onClick={() => handleStatusClick(status)}
                  >
                    {getStatusActionLabel(status)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className={css.contentCard}>
        <div className={css.tabsWrap}>
          <Tabs
            items={orderTabs}
            activeValue={activeTab}
            ariaLabel="Order details tabs"
            mobileVisibleCount={1}
            tabletVisibleCount={3}
            onChange={setActiveTab}
          />
        </div>

        {!isCreateMode && !isEditable && order.status === 'new' ? (
          <p className={css.lockNotice}>
            Take this order into work to edit it.
          </p>
        ) : null}

        {!isCreateMode &&
        !isEditable &&
        (order.status === 'successful' || order.status === 'rejected') ? (
          <p className={css.lockNotice}>
            This order has a final status and can no longer be edited.
          </p>
        ) : null}

        {isCreateMode ? (
          <p className={css.draftNotice}>
            This is an unsaved order draft. Saving it reserves the selected
            products and immediately moves the order to In progress.
          </p>
        ) : null}

        <div className={css.tabPanel}>
          {activeTab === 'products' ? (
            <OrderProductsTab
              order={order}
              isEditable={isEditable}
              isUpdating={isOrderBusy}
              onQuantityChange={handleQuantityChange}
              onRemoveProduct={handleRequestRemoveProduct}
              onOpenProductModal={() => setIsProductModalOpen(true)}
            />
          ) : null}

          {activeTab === 'delivery' ? (
            <DeliveryTab
              order={order}
              isEditable={isEditable}
              deliveryMethod={deliveryMethod}
              recipientName={recipientName}
              recipientPhone={recipientPhone}
              deliveryAddress={deliveryAddress}
              deliveryErrors={deliveryErrors}
              deliveryTouchedFields={deliveryTouchedFields}
              isUpdating={isOrderBusy}
              onDeliveryMethodChange={handleDeliveryMethodChange}
              onRecipientNameChange={handleRecipientNameChange}
              onRecipientPhoneChange={handleRecipientPhoneChange}
              onDeliveryAddressChange={handleDeliveryAddressChange}
              onCopyValue={(value, label) => void handleCopyValue(value, label)}
              onSave={handleSaveDelivery}
            />
          ) : null}

          {activeTab === 'payment' ? (
            <PaymentTab
              order={order}
              paymentMethod={paymentMethod}
              isEditable={isEditable}
              isUpdating={isOrderBusy}
              onPaymentMethodChange={setPaymentMethod}
              onCopyValue={(value, label) => void handleCopyValue(value, label)}
              onSave={handleSavePayment}
            />
          ) : null}

          {activeTab === 'comment' ? (
            isCreateMode ? (
              <section className={css.methodCard}>
                <div className={css.draftTabMessage}>
                  <MessageSquareText size={24} aria-hidden="true" />
                  <div>
                    <h2>Order comments are available after saving</h2>
                    <p>
                      Save the order first, then add private manager notes in
                      this tab.
                    </p>
                  </div>
                </div>
              </section>
            ) : (
              <ManagerCommentTab
                orderId={order.id}
                totalComments={order.managerCommentsCount}
                isEditable={isEditable}
                onTotalChange={(total) =>
                  setOrder((currentOrder) =>
                    currentOrder
                      ? { ...currentOrder, managerCommentsCount: total }
                      : currentOrder
                  )
                }
              />
            )
          ) : null}

          {activeTab === 'history' ? (
            isCreateMode ? (
              <section className={css.methodCard}>
                <div className={css.draftTabMessage}>
                  <History size={24} aria-hidden="true" />
                  <div>
                    <h2>Order history will start after saving</h2>
                    <p>
                      The first event will record that the manager created the
                      order with status In progress.
                    </p>
                  </div>
                </div>
              </section>
            ) : (
              <HistoryTab
                historyEntries={historyEntries}
                rejectionReason={order.rejectionReason}
              />
            )
          ) : null}
        </div>
      </section>

      <ConfirmationModal
        isOpen={isCreateConfirmationOpen}
        title="Create this order?"
        description={
          selectedClient
            ? `The order will be assigned to ${selectedClient.name}, the selected products will be reserved, and the order will receive In progress status. It cannot be deleted after creation.`
            : 'The selected products will be reserved and the order will receive In progress status.'
        }
        confirmLabel="Create order"
        cancelLabel="Continue editing"
        isLoading={isCreatingOrder}
        onConfirm={() => void handleConfirmCreateOrder()}
        onCancel={() => {
          if (!isCreatingOrder) setIsCreateConfirmationOpen(false);
        }}
      />

      <ConfirmationModal
        isOpen={Boolean(pendingPriceQuantityChange)}
        title="ProductDetails price changed"
        description={
          pendingPriceQuantityChange ? (
            <>
              {pendingPriceQuantityChange.item.name} now costs{' '}
              <strong>
                {formatMoney(
                  pendingPriceQuantityChange.item.currentPrice ??
                    pendingPriceQuantityChange.item.unitPrice
                ) ?? '—'}
              </strong>{' '}
              instead of{' '}
              <strong>
                {formatMoney(pendingPriceQuantityChange.item.unitPrice) ?? '—'}
              </strong>
              . Increasing the quantity from{' '}
              {pendingPriceQuantityChange.item.quantity} to{' '}
              {pendingPriceQuantityChange.quantity} will use the current price
              for the updated order line.
            </>
          ) : null
        }
        confirmLabel="Use current price"
        cancelLabel="Keep current quantity"
        isLoading={isOrderBusy}
        onConfirm={() => {
          const pendingChange = pendingPriceQuantityChange;

          if (!pendingChange) return;

          setPendingPriceQuantityChange(null);
          applyQuantityChange(pendingChange.item, pendingChange.quantity);
        }}
        onCancel={() => {
          if (!isOrderBusy) setPendingPriceQuantityChange(null);
        }}
      />

      <ConfirmationModal
        isOpen={Boolean(productToRemove)}
        title="Remove product from order?"
        description={
          productToRemove
            ? isCreateMode
              ? `${productToRemove.name} will be removed from this unsaved order draft.`
              : `${productToRemove.name} will be removed and its reserved quantity will return to available stock.`
            : ''
        }
        confirmLabel="Remove product"
        cancelLabel="Keep product"
        confirmButtonClassName={css.dangerConfirmButton}
        isLoading={isOrderBusy}
        onConfirm={handleConfirmRemoveProduct}
        onCancel={() => {
          if (!isOrderBusy) setProductToRemove(null);
        }}
      />

      <ConfirmationModal
        isOpen={Boolean(pendingStatus && pendingStatus.status !== 'rejected')}
        title={statusModalText?.title ?? 'Update order status?'}
        description={statusModalText?.description ?? ''}
        confirmLabel={
          pendingStatus ? getStatusActionLabel(pendingStatus.status) : 'Confirm'
        }
        isLoading={isUpdatingStatus}
        onConfirm={() => void handleConfirmStatus()}
        onCancel={() => {
          if (!isUpdatingStatus) setPendingStatus(null);
        }}
      />

      {pendingStatus?.status === 'rejected' ? (
        <OrderCancellationModal
          value={rejectionReason}
          isLoading={isUpdatingStatus}
          onValueChange={setRejectionReason}
          onCancel={() => {
            if (!isUpdatingStatus) setPendingStatus(null);
          }}
          onConfirm={() => void handleConfirmStatus()}
        />
      ) : null}

      {isProductModalOpen ? (
        <ProductPickerModal
          order={order}
          onClose={() => setIsProductModalOpen(false)}
          onAddProduct={handleAddProduct}
        />
      ) : null}
    </main>
  );
}

export default OrderDetailsPageContent;
export { OrderDetailsPageContent };
