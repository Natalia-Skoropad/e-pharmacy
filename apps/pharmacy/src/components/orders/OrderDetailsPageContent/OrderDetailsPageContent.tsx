'use client';

import Link from 'next/link';

import {
  CircleMinus,
  CirclePlus,
  Clock,
  Copy,
  CreditCard,
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
  Wallet,
} from 'lucide-react';

import { useCallback, useEffect, useId, useMemo, useState } from 'react';

import {
  Button,
  ButtonLink,
  CloseIconButton,
  LoadingSpinner,
  QuantityCounter,
  RadioOption,
  RatingSummary,
  SearchInput,
  ShimmerImage,
  SvgIcon,
  Tabs,
  type TabItem,
} from '@e-pharmacy/ui/common';

import {
  AddressInput,
  CommentInput,
  NameInput,
  PhoneInput,
} from '@e-pharmacy/ui/form-fields';

import {
  ConfirmationModal,
  ModalBase,
  ModalRoot,
  OrderCancellationModal,
} from '@e-pharmacy/ui/modals';

import { useToast } from '@e-pharmacy/ui/feedback';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { StatusBadge } from '@e-pharmacy/ui/statistics';

import type {
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
  Product,
} from '@e-pharmacy/types';

import { PRODUCT_CATEGORY_LABELS } from '@e-pharmacy/types/products';
import { formatPrice, formatShortDate } from '@e-pharmacy/utils/formatters';

import {
  USER_ADDRESS_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_PHONE_MAX_LENGTH,
  hasValidationErrors,
  sanitizeAddress,
  sanitizeName,
  sanitizeOrderComment,
  sanitizePhone,
  validateOrderDeliveryForm,
  type OrderDeliveryFormErrors,
  type OrderDeliveryTouchedFields,
  type OrderDeliveryFormValues,
} from '@e-pharmacy/validation';

import {
  createPharmacyOrderComment,
  deletePharmacyOrderComment,
  getPharmacyOrderDetails,
  getPharmacyOrderComments,
  getPharmacyOrders,
  getProducts,
  updatePharmacyOrder,
  updatePharmacyOrderStatus,
} from '@/lib/api/browser';

import {
  ORDER_STATUS_LABELS,
  type PharmacyOrderActivityHistoryItem,
  type PharmacyOrderDetails,
  type PharmacyOrderItem,
  type PharmacyOrderManagerComment,
  type PharmacyOrderManagerCommentsResponse,
} from '@/lib/orders/orders';

import {
  getPharmacyOrdersPath,
  getPharmacyProductPath,
} from '@/lib/layout/routes';

import { getProductImageSrc } from '@/lib/products/product-images';

import css from './OrderDetailsPageContent.module.css';

//===================================================================

type OrderDetailsPageContentProps = Readonly<{
  orderId: string;
}>;

type PendingStatusChange = Readonly<{
  status: Extract<OrderStatus, 'in_progress' | 'successful' | 'rejected'>;
  rejectionReason?: string;
}>;

type PendingPriceQuantityChange = Readonly<{
  item: PharmacyOrderItem;
  quantity: number;
}>;

type OrderTab = 'products' | 'delivery' | 'payment' | 'comment' | 'history';

//===================================================================

const PRODUCT_PICKER_LIMIT = 150;
const COMMENTS_PER_PAGE = 5;
const MANAGER_COMMENT_MAX_LENGTH = 1000;
const REJECTION_REASON_MAX_LENGTH = 500;

//===================================================================

const ORDER_TABS: Array<TabItem<OrderTab>> = [
  { value: 'products', label: 'Order products' },
  { value: 'delivery', label: 'Delivery method' },
  { value: 'payment', label: 'Payment method' },
  { value: 'comment', label: 'Order comment' },
  { value: 'history', label: 'Order history' },
];

//===================================================================

function formatOrderDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return formatShortDate(value);

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
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

function getProductOffer(product: Product, pharmacyId: string) {
  return product.offers.find((offer) => offer.pharmacyId === pharmacyId);
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
    recipientPhone: order.recipientPhone ?? '',
    deliveryAddress: order.deliveryAddress ?? '',
    paymentMethod: order.paymentMethod,
  };
}

//===================================================================

function getCommentPageItems(currentPage: number, totalPages: number) {
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  const adjustedStart = Math.max(1, end - 4);

  return Array.from(
    { length: end - adjustedStart + 1 },
    (_, index) => adjustedStart + index
  );
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
              <dd>{formatPrice(item.totalPrice)}</dd>
            </div>
            <div className={css.unitPriceRow}>
              <dt>Unit price</dt>
              <dd>{formatPrice(item.unitPrice)}</dd>
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
            <ButtonLink
              href={getPharmacyProductPath(item.productId)}
              variant="secondary"
              size="sm"
              renderLink={({ href, className, children, ...props }) => (
                <Link href={href} className={className} {...props}>
                  {children}
                </Link>
              )}
            >
              Product details
            </ButtonLink>

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

function ProductPickerModal({
  order,
  onClose,
  onAddProduct,
}: Readonly<{
  order: PharmacyOrderDetails;
  onClose: () => void;
  onAddProduct: (product: Product) => Promise<void>;
}>) {
  const titleId = useId();
  const searchId = useId();
  const [searchValue, setSearchValue] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingOfferId, setAddingOfferId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsLoading(true);
        setError('');

        const response = await getProducts(
          {
            pharmacyId: order.pharmacyId,
            inStock: true,
            page: 1,
            perPage: PRODUCT_PICKER_LIMIT,
            keyword: searchValue.trim() || undefined,
          },
          { signal: controller.signal }
        );

        setProducts(response.items);
        setTotal(response.total);
      } catch {
        if (!controller.signal.aborted) {
          setError('Could not load products from this pharmacy.');
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [order.pharmacyId, searchValue]);

  return (
    <ModalRoot>
      <ModalBase
        labelledBy={titleId}
        dialogClassName={css.productModal}
        onClose={onClose}
      >
        <div className={css.modalHead}>
          <div>
            <p className={css.modalKicker}>Add products to order</p>
            <h2 className={css.modalTitle} id={titleId}>
              Products in this pharmacy
            </h2>
          </div>

          <CloseIconButton onClick={onClose} />
        </div>

        <div className={css.searchRow}>
          <SearchInput
            id={searchId}
            label="Search products"
            value={searchValue}
            placeholder="Product name or article"
            isActive={Boolean(searchValue)}
            onChange={setSearchValue}
          />

          <p className={css.availableCount}>{formatAvailableItems(total)}</p>
        </div>

        {error ? <p className={css.errorText}>{error}</p> : null}

        <div className={css.modalResults}>
          {isLoading ? <LoadingSpinner label="Loading products..." /> : null}

          {!isLoading && products.length === 0 ? (
            <p className={css.metaText}>
              No matching products in this pharmacy.
            </p>
          ) : null}

          {!isLoading && products.length > 0 ? (
            <ul className={css.modalProductList}>
              {products.map((product) => {
                const offer = getProductOffer(product, order.pharmacyId);
                const existingItem = offer
                  ? order.items.find((item) => item.productOfferId === offer.id)
                  : undefined;
                const isAlreadyAdded = Boolean(existingItem);
                const availableQuantity =
                  existingItem?.availableQuantity ??
                  offer?.availableQuantity ??
                  0;
                const imageSrc = getProductImageSrc(product.imageUrl);
                const categoryLabel =
                  PRODUCT_CATEGORY_LABELS[product.category] ?? product.category;

                return (
                  <li className={css.modalProductItem} key={product.id}>
                    <div className={css.modalProductImageWrap}>
                      {imageSrc ? (
                        <ShimmerImage
                          className={css.modalProductImage}
                          src={imageSrc}
                          alt={product.name}
                          sizes="72px"
                          unoptimized
                        />
                      ) : (
                        <div
                          className={css.modalProductFallback}
                          aria-hidden="true"
                        >
                          <SvgIcon name="icon-shopping-cart" size={24} />
                        </div>
                      )}
                    </div>

                    <div className={css.modalProductInfo}>
                      <h3>{product.name}</h3>
                      <p>{categoryLabel}</p>
                      <span>{formatAvailableItems(availableQuantity)}</span>
                    </div>

                    <p className={css.modalProductPrice}>
                      {formatPrice(offer?.price ?? product.price)}
                    </p>

                    <Button
                      type="button"
                      size="sm"
                      variant={isAlreadyAdded ? 'secondary' : 'primary'}
                      isLoading={addingOfferId === offer?.id}
                      disabled={
                        !offer ||
                        availableQuantity < 1 ||
                        isAlreadyAdded ||
                        Boolean(addingOfferId)
                      }
                      onClick={async () => {
                        if (!offer) return;

                        setAddingOfferId(offer.id);

                        try {
                          await onAddProduct(product);
                        } finally {
                          setAddingOfferId(null);
                        }
                      }}
                    >
                      <ShoppingCart size={18} aria-hidden="true" />
                      {isAlreadyAdded ? 'Added' : 'Add'}
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </ModalBase>
    </ModalRoot>
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
          {order.items.map((item) => (
            <OrderProductCard
              key={item.productOfferId}
              item={item}
              isEditable={isEditable}
              isUpdating={isUpdating}
              onQuantityChange={onQuantityChange}
              onRemove={onRemoveProduct}
            />
          ))}
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
            <dd>{formatPrice(order.totalAmount)}</dd>
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
  onSave: () => void;
}>) {
  return (
    <section className={css.methodCard} aria-labelledby="delivery-title">
      <h2 id="delivery-title">Delivery method</h2>

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
            label="Pickup from pharmacy"
            disabled={!isEditable || isUpdating}
            onChange={onDeliveryMethodChange}
          />

          <RadioOption
            name="delivery-method"
            value="postal_delivery"
            checked={deliveryMethod === 'postal_delivery'}
            label="Postal delivery"
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

                <li>
                  <Clock size={18} aria-hidden="true" />
                  <span>
                    Use the approved pharmacy working hours from the public
                    profile.
                  </span>
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

      <Button
        className={css.tabSaveButton}
        type="button"
        disabled={!isEditable || isUpdating}
        onClick={onSave}
      >
        Save delivery method
      </Button>
    </section>
  );
}

//===================================================================

function PaymentTab({
  order,
  paymentMethod,
  copiedEmail,
  isEditable,
  isUpdating,
  onPaymentMethodChange,
  onCopyEmail,
  onSave,
}: Readonly<{
  order: PharmacyOrderDetails;
  paymentMethod: PaymentMethod;
  copiedEmail: boolean;
  isEditable: boolean;
  isUpdating: boolean;
  onPaymentMethodChange: (value: PaymentMethod) => void;
  onCopyEmail: () => void;
  onSave: () => void;
}>) {
  const bankDetails = order.bankDetails;
  const receiptEmail = bankDetails?.receiptEmail ?? order.pharmacyEmail ?? '';

  return (
    <section className={css.methodCard} aria-labelledby="payment-title">
      <h2 id="payment-title">Payment method</h2>

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
            label="Cash on pickup / delivery"
            disabled={!isEditable || isUpdating}
            onChange={onPaymentMethodChange}
          />

          <RadioOption
            name="payment-method"
            value="bank_transfer"
            checked={paymentMethod === 'bank_transfer'}
            label="Bank transfer"
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
            <div className={css.bankCard}>
              <CreditCard size={20} aria-hidden="true" />
              <h3>Bank details</h3>

              {bankDetails ? (
                <dl className={css.bankList}>
                  <div>
                    <dt>Recipient</dt>
                    <dd>{bankDetails.recipientName}</dd>
                  </div>
                  <div>
                    <dt>EDRPOU / Tax ID</dt>
                    <dd>{bankDetails.taxId}</dd>
                  </div>
                  <div>
                    <dt>IBAN</dt>
                    <dd>{bankDetails.iban}</dd>
                  </div>
                  <div>
                    <dt>Bank</dt>
                    <dd>{bankDetails.bankName}</dd>
                  </div>
                  <div>
                    <dt>Payment purpose</dt>
                    <dd>{bankDetails.paymentPurpose}</dd>
                  </div>
                </dl>
              ) : (
                <p className={css.metaText}>
                  Bank transfer is unavailable because the pharmacy has not
                  provided bank details yet.
                </p>
              )}

              {bankDetails && receiptEmail ? (
                <div className={css.emailNote}>
                  <Mail size={18} aria-hidden="true" />
                  <p>
                    After payment, the client should send the receipt to the
                    pharmacy email for faster processing.
                  </p>
                  <button
                    className={css.copyButton}
                    type="button"
                    disabled={!isEditable || isUpdating}
                    onClick={onCopyEmail}
                  >
                    <span>{receiptEmail}</span>
                    <Copy size={16} aria-hidden="true" />
                  </button>
                  {copiedEmail ? (
                    <span className={css.copiedText}>Copied</span>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

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
    </section>
  );
}

//===================================================================

function ManagerCommentTab({
  value,
  comments,
  currentPage,
  totalPages,
  totalComments,
  isEditable,
  isLoading,
  isSaving,
  deletingCommentId,
  error,
  onChange,
  onSave,
  onDelete,
  onPageChange,
}: Readonly<{
  value: string;
  comments: PharmacyOrderManagerComment[];
  currentPage: number;
  totalPages: number;
  totalComments: number;
  isEditable: boolean;
  isLoading: boolean;
  isSaving: boolean;
  deletingCommentId: string | null;
  error: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onDelete: (comment: PharmacyOrderManagerComment) => void;
  onPageChange: (page: number) => void;
}>) {
  const pageItems = getCommentPageItems(currentPage, totalPages);

  return (
    <section className={css.methodCard} aria-labelledby="manager-comment-title">
      <div className={css.commentSectionHead}>
        <div>
          <h2 id="manager-comment-title">Order comments</h2>
          <p className={css.metaText}>
            Private manager notes for processing this order.
          </p>
        </div>

        <span className={css.commentCount}>{totalComments}</span>
      </div>

      <div className={css.commentComposer}>
        <CommentInput
          id="manager-comment"
          name="managerComment"
          label="New manager comment"
          placeholder="Write an internal comment for this order..."
          value={value}
          error=""
          isTouched={false}
          maxLength={MANAGER_COMMENT_MAX_LENGTH}
          disabled={!isEditable || isSaving}
          onChange={(event) => onChange(event.target.value)}
        />

        <Button
          className={css.tabSaveButton}
          type="button"
          isLoading={isSaving}
          disabled={!isEditable || isSaving || !value.trim()}
          onClick={onSave}
        >
          Add comment
        </Button>
      </div>

      <div className={css.savedComments}>
        <h3>Saved comments</h3>

        {error ? <p className={css.errorText}>{error}</p> : null}
        {isLoading ? <LoadingSpinner label="Loading comments..." /> : null}

        {!isLoading && !error && comments.length === 0 ? (
          <p className={css.commentsEmpty}>
            No manager comments yet. The comment drawer is waiting patiently.
          </p>
        ) : null}

        {!isLoading && comments.length > 0 ? (
          <ul className={css.commentList}>
            {comments.map((comment) => (
              <li className={css.commentCard} key={comment.id}>
                <div className={css.commentCardHead}>
                  <div>
                    <strong>Manager comment</strong>
                    <time dateTime={comment.createdAt}>
                      {formatOrderDate(comment.createdAt)}
                    </time>
                  </div>

                  <Button
                    className={css.commentDeleteButton}
                    type="button"
                    size="sm"
                    variant="ghost"
                    isLoading={deletingCommentId === comment.id}
                    disabled={
                      !isEditable || Boolean(deletingCommentId) || isSaving
                    }
                    onClick={() => onDelete(comment)}
                  >
                    <Trash2 size={17} aria-hidden="true" />
                    Delete
                  </Button>
                </div>

                <p>{comment.text}</p>
              </li>
            ))}
          </ul>
        ) : null}

        {totalPages > 1 ? (
          <nav
            className={css.commentPagination}
            aria-label="Order comments pagination"
          >
            <button
              type="button"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => onPageChange(currentPage - 1)}
            >
              Previous
            </button>

            {pageItems.map((page) => (
              <button
                key={page}
                type="button"
                className={
                  page === currentPage ? css.commentPageActive : undefined
                }
                aria-current={page === currentPage ? 'page' : undefined}
                disabled={isLoading}
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Next
            </button>
          </nav>
        ) : null}
      </div>
    </section>
  );
}

//===================================================================

function getOrderActivityLabel(
  activity: PharmacyOrderActivityHistoryItem
): string {
  if (activity.type === 'product_added') return 'Product added';
  if (activity.type === 'product_removed') return 'Product removed';
  if (activity.type === 'quantity_increased') return 'Quantity increased';

  return 'Quantity decreased';
}

//===================================================================

function HistoryTab({ order }: Readonly<{ order: PharmacyOrderDetails }>) {
  const historyEntries = [
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

  return (
    <section className={css.methodCard} aria-labelledby="history-title">
      <div className={css.historyHeader}>
        <div>
          <h2 id="history-title">Order history</h2>
          <p className={css.metaText}>
            Status changes and product updates are shown from newest to oldest.
          </p>
        </div>

        <span className={css.historyCount}>{historyEntries.length}</span>
      </div>

      <ol className={css.historyList}>
        {historyEntries.map((historyEntry) => {
          if (historyEntry.kind === 'status') {
            const entry = historyEntry.entry;

            return (
              <li key={historyEntry.id}>
                <History size={18} aria-hidden="true" />
                <div className={css.historyContent}>
                  <strong>{ORDER_STATUS_LABELS[entry.status]}</strong>
                  <time dateTime={entry.changedAt}>
                    {formatOrderDate(entry.changedAt)}
                  </time>
                  {entry.comment ? <p>{entry.comment}</p> : null}
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

          return (
            <li key={historyEntry.id}>
              <ActivityIcon size={18} aria-hidden="true" />
              <div className={css.historyContent}>
                <strong>{getOrderActivityLabel(activity)}</strong>
                <time dateTime={activity.occurredAt}>
                  {formatOrderDate(activity.occurredAt)}
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
                    {formatPrice(activity.previousUnitPrice)} to{' '}
                    {formatPrice(activity.unitPrice)}.
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      {order.rejectionReason ? (
        <div className={css.rejectionBox}>
          <h3>Rejection reason</h3>
          <p>{order.rejectionReason}</p>
        </div>
      ) : null}
    </section>
  );
}

//===================================================================

function OrderDetailsPageContent({ orderId }: OrderDetailsPageContentProps) {
  const toast = useToast();
  const [order, setOrder] = useState<PharmacyOrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<OrderTab>('products');
  const [pendingStatus, setPendingStatus] =
    useState<PendingStatusChange | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
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
  const [copiedEmail, setCopiedEmail] = useState(false);

  const [commentDraft, setCommentDraft] = useState('');
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsData, setCommentsData] =
    useState<PharmacyOrderManagerCommentsResponse>({
      items: [],
      page: 1,
      perPage: COMMENTS_PER_PAGE,
      total: 0,
      totalPages: 1,
    });
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState('');
  const [isSavingComment, setIsSavingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null
  );
  const [commentToDelete, setCommentToDelete] =
    useState<PharmacyOrderManagerComment | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadOrder() {
      setIsLoading(true);
      setError(null);

      try {
        let loadedOrder: PharmacyOrderDetails;

        try {
          loadedOrder = await getPharmacyOrderDetails(orderId);
        } catch (detailsError) {
          if (!/^\d+$/.test(orderId)) throw detailsError;

          const ordersResponse = await getPharmacyOrders({
            page: 1,
            perPage: 1,
          });
          const fallbackOrder = ordersResponse.items[0];

          if (!fallbackOrder) throw detailsError;

          loadedOrder = await getPharmacyOrderDetails(fallbackOrder.id);
        }

        if (isMounted) {
          const formState = getOrderFormState(loadedOrder);

          setOrder(loadedOrder);
          setDeliveryMethod(formState.deliveryMethod);
          setRecipientName(formState.recipientName);
          setRecipientPhone(formState.recipientPhone);
          setDeliveryAddress(formState.deliveryAddress);
          setPaymentMethod(formState.paymentMethod);
          setDeliveryTouchedFields({});
          setCommentDraft('');
          setCommentsPage(1);
          setCommentsData({
            items: [],
            page: 1,
            perPage: COMMENTS_PER_PAGE,
            total: 0,
            totalPages: 1,
          });
          setCommentsError('');
        }
      } catch {
        if (isMounted) {
          setOrder(null);
          setError('Could not load the order. Please try again.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadOrder();

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const orderIdForComments = order?.id;

  const loadComments = useCallback(
    async (page: number) => {
      if (!orderIdForComments) return;

      setIsCommentsLoading(true);
      setCommentsError('');

      try {
        const response = await getPharmacyOrderComments(orderIdForComments, {
          page,
          perPage: COMMENTS_PER_PAGE,
        });

        setCommentsData(response);

        if (response.page !== page) {
          setCommentsPage(response.page);
        }
      } catch (commentsLoadError) {
        setCommentsError(
          commentsLoadError instanceof Error && commentsLoadError.message
            ? commentsLoadError.message
            : 'Could not load order comments.'
        );
      } finally {
        setIsCommentsLoading(false);
      }
    },
    [orderIdForComments]
  );

  useEffect(() => {
    if (activeTab !== 'comment' || !orderIdForComments) return;

    const timeoutId = window.setTimeout(() => {
      void loadComments(commentsPage);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [activeTab, commentsPage, loadComments, orderIdForComments]);

  const isEditable = order?.status === 'in_progress';
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
    if (!order) return [] as Array<PendingStatusChange['status']>;
    if (order.status === 'new') {
      return ['in_progress'] as Array<PendingStatusChange['status']>;
    }
    if (order.status === 'in_progress') {
      return ['successful', 'rejected'] as Array<PendingStatusChange['status']>;
    }
    return [] as Array<PendingStatusChange['status']>;
  }, [order]);

  const syncOrderState = (updatedOrder: PharmacyOrderDetails) => {
    const formState = getOrderFormState(updatedOrder);

    setOrder(updatedOrder);
    setDeliveryMethod(formState.deliveryMethod);
    setRecipientName(formState.recipientName);
    setRecipientPhone(formState.recipientPhone);
    setDeliveryAddress(formState.deliveryAddress);
    setPaymentMethod(formState.paymentMethod);
  };

  const updateOrderDraft = async (
    payload: Parameters<typeof updatePharmacyOrder>[1]
  ): Promise<PharmacyOrderDetails | null> => {
    if (!order) return null;

    setIsUpdatingOrder(true);

    try {
      const updatedOrder = await updatePharmacyOrder(order.id, payload);

      syncOrderState(updatedOrder);
      toast.success('Order updated successfully.');

      return updatedOrder;
    } catch (updateError) {
      toast.error(
        updateError instanceof Error && updateError.message
          ? updateError.message
          : 'Could not update order.'
      );

      return null;
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  const applyQuantityChange = (item: PharmacyOrderItem, quantity: number) => {
    if (!order || !isEditable || isUpdatingOrder) return;

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
    if (!order || !isEditable || isUpdatingOrder) return;

    if (quantity < 1 && order.items.length <= 1) {
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
    if (!order || !isEditable || isUpdatingOrder) return;

    if (order.items.length <= 1) {
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

  const handleAddProduct = async (product: Product): Promise<void> => {
    if (!order || !isEditable || isUpdatingOrder) return;

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

    const nextItems = [
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

    await updateOrderDraft({ items: getOrderItemsPayload(nextItems) });
  };

  const handleDeliveryMethodChange = (value: DeliveryMethod) => {
    setDeliveryMethod(value);

    if (value === 'pickup') {
      setDeliveryTouchedFields({});
    }
  };

  const handleRecipientNameChange = (value: string) => {
    setRecipientName(sanitizeName(value));
    setDeliveryTouchedFields((current) => ({
      ...current,
      recipientName: true,
    }));
  };

  const handleRecipientPhoneChange = (value: string) => {
    setRecipientPhone(sanitizePhone(value));
    setDeliveryTouchedFields((current) => ({
      ...current,
      recipientPhone: true,
    }));
  };

  const handleDeliveryAddressChange = (value: string) => {
    setDeliveryAddress(sanitizeAddress(value));
    setDeliveryTouchedFields((current) => ({
      ...current,
      deliveryAddress: true,
    }));
  };

  const handleSaveDelivery = () => {
    const nextErrors = validateOrderDeliveryForm(
      deliveryValues,
      deliveryMethod
    );

    if (hasValidationErrors(nextErrors)) {
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
      return;
    }

    const payload =
      deliveryMethod === 'pickup'
        ? { deliveryMethod }
        : {
            deliveryMethod,
            deliveryDetails: {
              recipientName: recipientName.trim(),
              recipientPhone: recipientPhone.trim(),
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

    void updateOrderDraft({ paymentMethod });
  };

  const handleCopyEmail = async () => {
    const email =
      order?.bankDetails?.receiptEmail ?? order?.pharmacyEmail ?? '';

    if (!email) return;

    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 1800);
    } catch {
      toast.error('Could not copy the pharmacy email.');
    }
  };

  const handleSaveManagerComment = async () => {
    if (!order || !isEditable || isSavingComment) return;

    const text = commentDraft.trim();

    if (!text) return;

    setIsSavingComment(true);

    try {
      await createPharmacyOrderComment(order.id, text);
      setCommentDraft('');
      toast.success('Comment added successfully.');

      if (commentsPage === 1) {
        await loadComments(1);
      } else {
        setCommentsPage(1);
      }
    } catch (commentError) {
      toast.error(
        commentError instanceof Error && commentError.message
          ? commentError.message
          : 'Could not add the comment.'
      );
    } finally {
      setIsSavingComment(false);
    }
  };

  const handleConfirmDeleteComment = async () => {
    if (!order || !commentToDelete || deletingCommentId) return;

    const comment = commentToDelete;
    setCommentToDelete(null);
    setDeletingCommentId(comment.id);

    try {
      await deletePharmacyOrderComment(order.id, comment.id);
      toast.success('Comment deleted successfully.');

      const nextPage =
        commentsData.items.length === 1 && commentsPage > 1
          ? commentsPage - 1
          : commentsPage;

      if (nextPage !== commentsPage) {
        setCommentsPage(nextPage);
      } else {
        await loadComments(nextPage);
      }
    } catch (commentError) {
      toast.error(
        commentError instanceof Error && commentError.message
          ? commentError.message
          : 'Could not delete the comment.'
      );
    } finally {
      setDeletingCommentId(null);
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
    if (!order || !pendingStatus) return;

    setIsUpdatingStatus(true);

    try {
      const payload =
        pendingStatus.status === 'rejected'
          ? {
              status: pendingStatus.status,
              rejectionReason: rejectionReason.trim(),
            }
          : pendingStatus;

      const updatedOrder = await updatePharmacyOrderStatus(order.id, payload);

      syncOrderState(updatedOrder);
      setPendingStatus(null);
      setRejectionReason('');
      toast.success('Order status updated successfully.');
    } catch (statusError) {
      toast.error(
        statusError instanceof Error && statusError.message
          ? statusError.message
          : 'Could not update order status.'
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <main className={css.page} aria-label="Loading order">
        <section className={css.contentCard}>
          <LoadingSpinner label="Loading order..." />
        </section>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className={css.page} aria-labelledby="order-details-page-title">
        <section className={css.contentCard}>
          <PageHeader
            title="Order not found"
            titleId="order-details-page-title"
            icon={<ShoppingBag size={23} aria-hidden="true" />}
          />
          <p className={css.errorText}>{error ?? 'Order not found.'}</p>
          <ButtonLink
            href={getPharmacyOrdersPath()}
            renderLink={({ href, className, children, ...props }) => (
              <Link href={href} className={className} {...props}>
                {children}
              </Link>
            )}
          >
            Back to orders
          </ButtonLink>
        </section>
      </main>
    );
  }

  return (
    <main className={css.page} aria-labelledby="order-details-page-title">
      <section className={css.contentCard}>
        <div className={css.headerGrid}>
          <div className={css.titleBlock}>
            <PageHeader
              title={`Order ${order.orderNumber}`}
              titleId="order-details-page-title"
              icon={<ShoppingBag size={23} aria-hidden="true" />}
            />
            <p className={css.metaText}>
              Created on {formatOrderDate(order.orderDate)}
            </p>
          </div>

          <div className={css.statusActions}>
            <StatusBadge
              status={order.status}
              label={ORDER_STATUS_LABELS[order.status]}
            />

            {statusActions.map((status) => (
              <Button
                key={status}
                type="button"
                size="sm"
                variant={status === 'rejected' ? 'secondary' : 'primary'}
                className={status === 'rejected' ? css.rejectButton : undefined}
                disabled={isUpdatingStatus || isUpdatingOrder}
                onClick={() => handleStatusClick(status)}
              >
                {getStatusActionLabel(status)}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section className={css.contentCard}>
        <div className={css.tabsWrap}>
          <Tabs
            items={ORDER_TABS}
            activeValue={activeTab}
            ariaLabel="Order details tabs"
            mobileVisibleCount={1}
            tabletVisibleCount={3}
            onChange={setActiveTab}
          />
        </div>

        {!isEditable && order.status === 'new' ? (
          <p className={css.lockNotice}>
            Take this order into work to edit it.
          </p>
        ) : null}

        {!isEditable &&
        (order.status === 'successful' || order.status === 'rejected') ? (
          <p className={css.lockNotice}>
            This order has a final status and can no longer be edited.
          </p>
        ) : null}

        <div className={css.tabPanel}>
          {activeTab === 'products' ? (
            <OrderProductsTab
              order={order}
              isEditable={isEditable}
              isUpdating={isUpdatingOrder}
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
              isUpdating={isUpdatingOrder}
              onDeliveryMethodChange={handleDeliveryMethodChange}
              onRecipientNameChange={handleRecipientNameChange}
              onRecipientPhoneChange={handleRecipientPhoneChange}
              onDeliveryAddressChange={handleDeliveryAddressChange}
              onSave={handleSaveDelivery}
            />
          ) : null}

          {activeTab === 'payment' ? (
            <PaymentTab
              order={order}
              paymentMethod={paymentMethod}
              copiedEmail={copiedEmail}
              isEditable={isEditable}
              isUpdating={isUpdatingOrder}
              onPaymentMethodChange={setPaymentMethod}
              onCopyEmail={() => void handleCopyEmail()}
              onSave={handleSavePayment}
            />
          ) : null}

          {activeTab === 'comment' ? (
            <ManagerCommentTab
              value={commentDraft}
              comments={commentsData.items}
              currentPage={commentsData.page}
              totalPages={commentsData.totalPages}
              totalComments={commentsData.total}
              isEditable={isEditable}
              isLoading={isCommentsLoading}
              isSaving={isSavingComment}
              deletingCommentId={deletingCommentId}
              error={commentsError}
              onChange={(value) =>
                setCommentDraft(value.slice(0, MANAGER_COMMENT_MAX_LENGTH))
              }
              onSave={() => void handleSaveManagerComment()}
              onDelete={setCommentToDelete}
              onPageChange={setCommentsPage}
            />
          ) : null}

          {activeTab === 'history' ? <HistoryTab order={order} /> : null}
        </div>
      </section>

      <ConfirmationModal
        isOpen={Boolean(pendingPriceQuantityChange)}
        title="Product price changed"
        description={
          pendingPriceQuantityChange ? (
            <>
              {pendingPriceQuantityChange.item.name} now costs{' '}
              <strong>
                {formatPrice(
                  pendingPriceQuantityChange.item.currentPrice ??
                    pendingPriceQuantityChange.item.unitPrice
                )}
              </strong>{' '}
              instead of{' '}
              <strong>
                {formatPrice(pendingPriceQuantityChange.item.unitPrice)}
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
        isLoading={isUpdatingOrder}
        onConfirm={() => {
          const pendingChange = pendingPriceQuantityChange;

          if (!pendingChange) return;

          setPendingPriceQuantityChange(null);
          applyQuantityChange(pendingChange.item, pendingChange.quantity);
        }}
        onCancel={() => {
          if (!isUpdatingOrder) setPendingPriceQuantityChange(null);
        }}
      />

      <ConfirmationModal
        isOpen={Boolean(productToRemove)}
        title="Remove product from order?"
        description={
          productToRemove
            ? `${productToRemove.name} will be removed and its reserved quantity will return to available stock.`
            : ''
        }
        confirmLabel="Remove product"
        cancelLabel="Keep product"
        confirmButtonClassName={css.dangerConfirmButton}
        isLoading={isUpdatingOrder}
        onConfirm={handleConfirmRemoveProduct}
        onCancel={() => {
          if (!isUpdatingOrder) setProductToRemove(null);
        }}
      />

      <ConfirmationModal
        isOpen={Boolean(commentToDelete)}
        title="Delete this comment?"
        description="The comment will be permanently removed from the order."
        confirmLabel="Delete comment"
        cancelLabel="Keep comment"
        confirmButtonClassName={css.dangerConfirmButton}
        isLoading={Boolean(deletingCommentId)}
        onConfirm={() => void handleConfirmDeleteComment()}
        onCancel={() => {
          if (!deletingCommentId) setCommentToDelete(null);
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
          minLength={100}
          maxLength={REJECTION_REASON_MAX_LENGTH}
          onChange={(value) =>
            setRejectionReason(
              sanitizeOrderComment(value).slice(0, REJECTION_REASON_MAX_LENGTH)
            )
          }
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
