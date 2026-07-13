'use client';

import Link from 'next/link';
import {
  Clock,
  CreditCard,
  History,
  MapPin,
  Phone,
  MessageSquareText,
  ShoppingBag,
  ShoppingCart,
  Wallet,
} from 'lucide-react';

import { useEffect, useId, useMemo, useState } from 'react';

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

import { ConfirmationModal, ModalBase, ModalRoot } from '@e-pharmacy/ui/modals';
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
  getPharmacyOrderDetails,
  getPharmacyOrders,
  getProducts,
  updatePharmacyOrder,
  updatePharmacyOrderStatus,
} from '@/lib/api/browser';

import {
  ORDER_STATUS_LABELS,
  type PharmacyOrderDetails,
  type PharmacyOrderItem,
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

type OrderTab = 'products' | 'delivery' | 'payment' | 'comment' | 'history';

//===================================================================

const PRODUCT_PICKER_LIMIT = 150;

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
    managerComment: order.managerComment ?? '',
  };
}

//===================================================================

function OrderProductCard({
  item,
  isEditable,
  isUpdating,
  onQuantityChange,
}: Readonly<{
  item: PharmacyOrderItem;
  isEditable: boolean;
  isUpdating: boolean;
  onQuantityChange: (item: PharmacyOrderItem, quantity: number) => void;
}>) {
  const imageSrc = getProductImageSrc(item.imageUrl);
  const stockQuantity = item.quantity + (item.availableQuantity ?? 0);

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
            <div>
              <dt>Unit price</dt>
              <dd>{formatPrice(item.unitPrice)}</dd>
            </div>
            <div>
              <dt>Total amount</dt>
              <dd>{formatPrice(item.totalPrice)}</dd>
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
              {formatAvailableItems(stockQuantity)}
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
              onClick={() => onQuantityChange(item, 0)}
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
  onAddProduct: (product: Product) => void;
}>) {
  const titleId = useId();
  const searchId = useId();
  const [searchValue, setSearchValue] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
                const categoryLabel =
                  PRODUCT_CATEGORY_LABELS[product.category] ?? product.category;

                return (
                  <li className={css.modalProductItem} key={product.id}>
                    <div className={css.modalProductImageWrap}>
                      {product.imageUrl ? (
                        <ShimmerImage
                          className={css.modalProductImage}
                          src={product.imageUrl}
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
                      <span>
                        {formatAvailableItems(offer?.availableQuantity ?? 0)}
                      </span>
                    </div>

                    <p className={css.modalProductPrice}>
                      {formatPrice(offer?.price ?? product.price)}
                    </p>

                    <Button
                      type="button"
                      size="sm"
                      disabled={!offer || offer.availableQuantity < 1}
                      onClick={() => onAddProduct(product)}
                    >
                      <ShoppingCart size={18} aria-hidden="true" />
                      Add
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
  onOpenProductModal,
}: Readonly<{
  order: PharmacyOrderDetails;
  isEditable: boolean;
  isUpdating: boolean;
  onQuantityChange: (item: PharmacyOrderItem, quantity: number) => void;
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
              <label>
                <span>Recipient name</span>
                <input
                  type="text"
                  value={recipientName}
                  maxLength={50}
                  disabled={!isEditable || isUpdating}
                  onChange={(event) =>
                    onRecipientNameChange(event.target.value)
                  }
                />
              </label>

              <label>
                <span>Recipient phone</span>
                <input
                  type="tel"
                  value={recipientPhone}
                  maxLength={13}
                  disabled={!isEditable || isUpdating}
                  onChange={(event) =>
                    onRecipientPhoneChange(event.target.value)
                  }
                />
              </label>

              <label className={css.fullField}>
                <span>Delivery address</span>
                <input
                  type="text"
                  value={deliveryAddress}
                  maxLength={120}
                  disabled={!isEditable || isUpdating}
                  onChange={(event) =>
                    onDeliveryAddressChange(event.target.value)
                  }
                />
              </label>
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
  paymentMethod,
  isEditable,
  isUpdating,
  onPaymentMethodChange,
  onSave,
}: Readonly<{
  paymentMethod: PaymentMethod;
  isEditable: boolean;
  isUpdating: boolean;
  onPaymentMethodChange: (value: PaymentMethod) => void;
  onSave: () => void;
}>) {
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
            disabled={!isEditable || isUpdating}
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
            <div className={css.paymentInfoCard}>
              <CreditCard size={20} aria-hidden="true" />
              <h3>Bank transfer</h3>
              <p>
                The client selected bank transfer. Check payment status before
                confirming the order.
              </p>
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
        Save payment method
      </Button>
    </section>
  );
}

//===================================================================

function ManagerCommentTab({
  value,
  isEditable,
  isUpdating,
  onChange,
  onSave,
  onDelete,
}: Readonly<{
  value: string;
  isEditable: boolean;
  isUpdating: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
  onDelete: () => void;
}>) {
  return (
    <section className={css.methodCard} aria-labelledby="manager-comment-title">
      <h2 id="manager-comment-title">Order comment</h2>
      <p className={css.metaText}>
        Private manager notes for processing this order.
      </p>

      <textarea
        className={css.commentTextarea}
        value={value}
        maxLength={1000}
        disabled={!isEditable || isUpdating}
        placeholder="Write an internal comment for this order..."
        onChange={(event) => onChange(event.target.value)}
      />

      <div className={css.commentActions}>
        <Button
          type="button"
          disabled={!isEditable || isUpdating}
          onClick={onSave}
        >
          Save comment
        </Button>

        <Button
          type="button"
          variant="secondary"
          className={css.rejectButton}
          disabled={!isEditable || isUpdating || !value.trim()}
          onClick={onDelete}
        >
          Delete comment
        </Button>
      </div>
    </section>
  );
}

//===================================================================

function HistoryTab({ order }: Readonly<{ order: PharmacyOrderDetails }>) {
  return (
    <section className={css.methodCard} aria-labelledby="history-title">
      <h2 id="history-title">Order history</h2>

      <ol className={css.historyList}>
        {order.statusHistory.map((entry, index) => (
          <li key={`${entry.status}-${entry.changedAt}-${index}`}>
            <History size={18} aria-hidden="true" />
            <div>
              <strong>{ORDER_STATUS_LABELS[entry.status]}</strong>
              <span>{formatOrderDate(entry.changedAt)}</span>
              {entry.comment ? <p>{entry.comment}</p> : null}
            </div>
          </li>
        ))}
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

function RejectOrderModal({
  value,
  isLoading,
  onChange,
  onCancel,
  onConfirm,
}: Readonly<{
  value: string;
  isLoading: boolean;
  onChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}>) {
  const titleId = useId();
  const isValid = value.trim().length >= 100;

  return (
    <ModalRoot>
      <ModalBase
        labelledBy={titleId}
        dialogClassName={css.rejectModal}
        onClose={onCancel}
      >
        <div className={css.modalHead}>
          <div>
            <p className={css.modalKicker}>Reject order</p>
            <h2 className={css.modalTitle} id={titleId}>
              Explain rejection reason
            </h2>
          </div>

          <CloseIconButton disabled={isLoading} onClick={onCancel} />
        </div>

        <p className={css.metaText}>
          Write at least 100 characters so Admin and client support can clearly
          understand why the order was rejected.
        </p>

        <textarea
          className={css.commentTextarea}
          value={value}
          minLength={100}
          maxLength={500}
          disabled={isLoading}
          onChange={(event) => onChange(event.target.value)}
        />

        <p className={isValid ? css.counterValid : css.counterError}>
          {value.trim().length}/100 minimum characters
        </p>

        <div className={css.modalActions}>
          <Button
            type="button"
            variant="secondary"
            disabled={isLoading}
            onClick={onCancel}
          >
            Cancel
          </Button>

          <Button
            type="button"
            className={css.rejectButton}
            disabled={!isValid || isLoading}
            onClick={onConfirm}
          >
            Reject order
          </Button>
        </div>
      </ModalBase>
    </ModalRoot>
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

  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>('pickup');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [managerComment, setManagerComment] = useState('');

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
          setManagerComment(formState.managerComment);
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

  const isEditable = order?.status === 'in_progress';
  const statusModalText = pendingStatus
    ? getStatusModalText(pendingStatus.status)
    : null;

  const statusActions = useMemo(() => {
    if (!order) return [] as Array<PendingStatusChange['status']>;
    if (order.status === 'new')
      return ['in_progress'] as Array<PendingStatusChange['status']>;
    if (order.status === 'in_progress')
      return ['successful', 'rejected'] as Array<PendingStatusChange['status']>;
    return [] as Array<PendingStatusChange['status']>;
  }, [order]);

  const updateOrderDraft = async (
    payload: Parameters<typeof updatePharmacyOrder>[1]
  ) => {
    if (!order) return;

    setIsUpdatingOrder(true);

    try {
      const updatedOrder = await updatePharmacyOrder(order.id, payload);
      const formState = getOrderFormState(updatedOrder);

      setOrder(updatedOrder);
      setDeliveryMethod(formState.deliveryMethod);
      setRecipientName(formState.recipientName);
      setRecipientPhone(formState.recipientPhone);
      setDeliveryAddress(formState.deliveryAddress);
      setPaymentMethod(formState.paymentMethod);
      setManagerComment(formState.managerComment);
      toast.success('Order updated successfully.');
    } catch (updateError) {
      toast.error(
        updateError instanceof Error && updateError.message
          ? updateError.message
          : 'Could not update order.'
      );
    } finally {
      setIsUpdatingOrder(false);
    }
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
      const shouldContinue = window.confirm(
        'The product price has changed. If you add one more unit, the current product price will be used.'
      );

      if (!shouldContinue) return;
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

  const handleAddProduct = (product: Product) => {
    if (!order || !isEditable || isUpdatingOrder) return;

    const offer = getProductOffer(product, order.pharmacyId);

    if (!offer || offer.availableQuantity < 1) {
      toast.error('This product is out of stock in your pharmacy.');
      return;
    }

    const existingItem = order.items.find(
      (item) => item.productOfferId === offer.id
    );

    if (
      existingItem?.currentPrice !== undefined &&
      existingItem.currentPrice !== existingItem.unitPrice
    ) {
      const shouldContinue = window.confirm(
        'The product price has changed. If you add one more unit, the current product price will be used.'
      );

      if (!shouldContinue) return;
    }

    const nextItems = existingItem
      ? order.items.map((item) =>
          item.productOfferId === offer.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      : [
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
            availableQuantity: offer.availableQuantity,
            currentPrice: offer.price,
          },
        ];

    setIsProductModalOpen(false);
    void updateOrderDraft({ items: getOrderItemsPayload(nextItems) });
  };

  const handleSaveDelivery = () => {
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
    void updateOrderDraft({ paymentMethod });
  };

  const handleSaveManagerComment = () => {
    void updateOrderDraft({ managerComment });
  };

  const handleDeleteManagerComment = () => {
    setManagerComment('');
    void updateOrderDraft({ managerComment: '' });
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
      const formState = getOrderFormState(updatedOrder);

      setOrder(updatedOrder);
      setDeliveryMethod(formState.deliveryMethod);
      setRecipientName(formState.recipientName);
      setRecipientPhone(formState.recipientPhone);
      setDeliveryAddress(formState.deliveryAddress);
      setPaymentMethod(formState.paymentMethod);
      setManagerComment(formState.managerComment);
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
              isUpdating={isUpdatingOrder}
              onDeliveryMethodChange={setDeliveryMethod}
              onRecipientNameChange={setRecipientName}
              onRecipientPhoneChange={setRecipientPhone}
              onDeliveryAddressChange={setDeliveryAddress}
              onSave={handleSaveDelivery}
            />
          ) : null}

          {activeTab === 'payment' ? (
            <PaymentTab
              paymentMethod={paymentMethod}
              isEditable={isEditable}
              isUpdating={isUpdatingOrder}
              onPaymentMethodChange={setPaymentMethod}
              onSave={handleSavePayment}
            />
          ) : null}

          {activeTab === 'comment' ? (
            <ManagerCommentTab
              value={managerComment}
              isEditable={isEditable}
              isUpdating={isUpdatingOrder}
              onChange={setManagerComment}
              onSave={handleSaveManagerComment}
              onDelete={handleDeleteManagerComment}
            />
          ) : null}

          {activeTab === 'history' ? <HistoryTab order={order} /> : null}
        </div>
      </section>

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
        <RejectOrderModal
          value={rejectionReason}
          isLoading={isUpdatingStatus}
          onChange={setRejectionReason}
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
