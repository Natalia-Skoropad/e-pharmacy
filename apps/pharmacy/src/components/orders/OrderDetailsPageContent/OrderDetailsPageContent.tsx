'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  Boxes,
  ChevronDown,
  CircleCheckBig,
  CirclePlay,
  CircleX,
  Clock,
  ClipboardCheck,
  CreditCard,
  History,
  LogOut,
  MessageSquareText,
  Save,
  ShoppingBag,
  Truck,
  Trash2,
  X,
} from 'lucide-react';

import {
  ORDER_STATUS_PRESENTATION,
  PHARMACY_STATUS_PRESENTATION,
} from '@e-pharmacy/config/presentation';

import {
  getOrderStatusTransitions,
  ORDER_PRICE_CHANGED_ERROR_CODE,
} from '@e-pharmacy/config/orders';

import { STOCK_CHANGED_ERROR_CODE } from '@e-pharmacy/config/cart';
import { Button, LoadingSpinner } from '@e-pharmacy/ui/primitives';
import { formatInitials } from '@e-pharmacy/ui/data-display';
import { TableImagePreview } from '@e-pharmacy/ui/media';
import { Tabs, type TabItem } from '@e-pharmacy/ui/navigation';
import { ConfirmationModal } from '@e-pharmacy/ui/overlays';
import { useToast } from '@e-pharmacy/ui/feedback';
import { PageHeader } from '@e-pharmacy/ui/layout';

import {
  OrderRejectionSourceBadge,
  StatusBanner,
} from '@e-pharmacy/ui/statistics';

import { isApiError } from '@e-pharmacy/api-client/transport';

import type {
  DeliveryMethod,
  OrderStatus,
  UpdateOrderStatusPayload,
  PaymentMethod,
} from '@e-pharmacy/types/orders';

import type { ProductDetails } from '@e-pharmacy/types/products';
import { formatMoney } from '@e-pharmacy/utils/money';
import { formatTableDateTimeParts } from '@e-pharmacy/utils/date';

import {
  buildOrderRejectionReasonError,
  hasValidationErrors,
  normalizePhoneInput,
  validateOrderDeliveryForm,
  type OrderDeliveryTouchedFields,
  type OrderDeliveryFormValues,
} from '@e-pharmacy/validation/order';

import {
  getPharmacyClientPath,
  getPharmacyOrderPath,
  getOwnedPharmacyPath,
  getPharmacyOrderTabPath,
  getPharmacyOrderTabFromPath,
} from '@/lib/routes';

import {
  createPharmacyOrder,
  getPharmacyClients,
  getPharmacyOrderDetails,
  updatePharmacyOrder,
  updatePharmacyOrderStatus,
  type CreatePharmacyOrderPayload,
} from '@/lib/api/browser';

import type { PharmacyClientRow } from '@/lib/clients/clients';

import type {
  PharmacyOrderDetails,
  PharmacyOrderItem,
} from '@/lib/orders/orders';

import { getPharmacyCheckoutDetails } from '@/lib/api/browser/pharmacy.api';
import { getOrderProductDetails } from '@/lib/api/browser/products.api';
import { getOwnedPharmacyDetail } from '@/lib/api/browser/owned-pharmacy-registry.api';
import { dispatchPharmacyBreadcrumbLabel } from '@/lib/layout/breadcrumbs';
import { dispatchOrderCounterRefresh } from '@/lib/orders/order-counter-refresh';
import { getProductImageSrc } from '@/lib/products/product-images';
import { getProductCategories } from '@/lib/api/browser/product-categories.api';
import { getSafeApiErrorMessage } from '@/lib/errors/get-safe-api-error-message';
import { getLockedFeatureBannerStatus } from '@/lib/pharmacies/current-pharmacy-status';

import { usePharmacyProfile } from '@/providers/PharmacyProfileProvider';

import { OrderCancellationModal } from '@/components/orders/OrderCancellationModal';
import { useUnsavedPharmacyNavigation } from '@/components/pharmacies/OwnedPharmacyEditor/useUnsavedPharmacyNavigation';

import {
  ManagerCommentTab,
  HistoryTab,
  type OrderHistoryEntry,
} from './OrderActivityTabs';

import { NewOrderClientSearch } from './NewOrderClientSearch';

import {
  OrderCreateConflictModal,
  type OrderCreateConflict,
  type OrderCreateConflictDetail,
} from './OrderCreateConflictModal';

import { ProductPickerModal } from './ProductPickerModal';
import { OrderProductsTab } from './OrderProductsTab';
import { OrderDetailsLoadingSkeleton } from './OrderDetailsLoadingSkeleton';
import { OrderPriceChangeModal } from './OrderPriceChangeModal';
import { DeliveryTab, PaymentTab } from './OrderMethodTabs';

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
  pharmacyId?: string;
}>;

type PendingStatusChange = Readonly<{
  status: Extract<OrderStatus, 'in_progress' | 'successful' | 'rejected'>;
  rejectionReason?: string;
}>;

type PendingPriceQuantityChange = Readonly<{
  item: PharmacyOrderItem;
  quantity: number;
}>;

function hasChangedProductPrice(item: PharmacyOrderItem): boolean {
  return (
    item.currentPrice !== undefined && item.currentPrice !== item.unitPrice
  );
}

//===================================================================

type OrderTab = 'products' | 'delivery' | 'payment' | 'comment' | 'history';

//===================================================================

function formatOrderCreatedAt(value: string): string {
  const parts = formatTableDateTimeParts(value);

  if (!parts) return '—';

  return `${parts.dayMonth} ${parts.year} at ${parts.time}`;
}

//===================================================================

function getOrderTabs(isCreateMode: boolean): Array<TabItem<OrderTab>> {
  const tabs: Array<TabItem<OrderTab>> = [
    {
      value: 'products',
      label: 'Order products',
      icon: <Boxes size={17} aria-hidden="true" />,
    },
    {
      value: 'delivery',
      label: 'Delivery method',
      icon: <Truck size={17} aria-hidden="true" />,
    },
    {
      value: 'payment',
      label: 'Payment method',
      icon: <CreditCard size={17} aria-hidden="true" />,
    },
  ];

  if (!isCreateMode) {
    tabs.push(
      {
        value: 'comment',
        label: 'Order comments',
        icon: <MessageSquareText size={17} aria-hidden="true" />,
      },
      {
        value: 'history',
        label: 'Order history',
        icon: <History size={17} aria-hidden="true" />,
      }
    );
  }

  return tabs;
}

//===================================================================

function getStatusActionLabel(status: PendingStatusChange['status']) {
  if (status === 'in_progress') return 'Take into work';
  if (status === 'successful') return 'Confirm order';

  return 'Reject order';
}

//===================================================================

function getOrderStatusSummary(status: OrderStatus) {
  if (status === 'new') {
    return {
      title: 'This order is new',
      message: 'Take this order into work to edit it.',
    };
  }

  if (status === 'in_progress') {
    return {
      title: 'This order is in progress',
      message:
        'Review and update the order details before confirming or rejecting it.',
    };
  }

  if (status === 'successful') {
    return {
      title: 'This order was completed successfully',
      message: 'This order has a final status and can no longer be edited.',
    };
  }

  return {
    title: 'This order was rejected',
    message: 'This order has a final status and can no longer be edited.',
  };
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

function OrderClientBadge({
  clientId,
  name,
  photoUrl,
}: Readonly<{
  clientId: string;
  name: string;
  photoUrl?: string | null;
}>) {
  return (
    <Link
      className={css.selectedClientPreview}
      href={getPharmacyClientPath(clientId)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${name} client details in a new tab`}
    >
      <TableImagePreview
        src={getProductImageSrc(photoUrl ?? undefined)}
        alt={`${name} photo`}
        fallback={formatInitials(name, 'C')}
        size={36}
      />
      <span>
        <small>Selected client</small>
        <strong>{name}</strong>
      </span>
    </Link>
  );
}

//===================================================================

function OrderPharmacyBadge({
  pharmacyId,
  name,
  imageUrl,
}: Readonly<{ pharmacyId: string; name: string; imageUrl?: string }>) {
  return (
    <Link
      className={`${css.selectedClientPreview} ${css.selectedPharmacyBadge}`}
      href={getOwnedPharmacyPath(pharmacyId)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${name} pharmacy details in a new tab`}
    >
      <TableImagePreview
        src={getProductImageSrc(imageUrl)}
        alt={`${name} photo`}
        fallback={formatInitials(name, 'P')}
        size={36}
      />
      <span>
        <small>Selected pharmacy</small>
        <strong>{name}</strong>
      </span>
    </Link>
  );
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
  pharmacyId,
  mode = 'details',
}: OrderDetailsPageContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const isCreateMode = mode === 'create';

  const { profile: pharmacyProfile, isLoading: isProfileLoading } =
    usePharmacyProfile();

  const pharmacyLockedStatus = getLockedFeatureBannerStatus(
    pharmacyProfile?.status
  );

  const createLockedStatus =
    isCreateMode && !pharmacyId ? pharmacyLockedStatus : null;

  const [order, setOrder] = useState<PharmacyOrderDetails | null>(null);
  const [clients, setClients] = useState<PharmacyClientRow[]>([]);

  const [categoryIcons, setCategoryIcons] = useState<
    Readonly<Record<string, string>>
  >({});

  const [selectedClientId, setSelectedClientId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState<OrderDetailsLoadError | null>(
    null
  );

  const [createTab, setActiveTab] = useState<OrderTab>('products');

  const activeTab: OrderTab = isCreateMode
    ? createTab
    : getPharmacyOrderTabFromPath(pathname);

  const [pendingStatus, setPendingStatus] =
    useState<PendingStatusChange | null>(null);

  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  const [rejectionReason, setRejectionReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const createPendingRef = useRef(false);

  const [isCreateConfirmationOpen, setIsCreateConfirmationOpen] =
    useState(false);

  const [createConflict, setCreateConflict] =
    useState<OrderCreateConflict | null>(null);

  // Latest verified warehouse quantities after a failed create attempt.
  // Keeping this separate from the draft quantity prevents silently deleting
  // an item that another order has just reserved.
  const [verifiedDraftStock, setVerifiedDraftStock] = useState<
    Readonly<Record<string, number | null>>
  >({});

  const [initialClientId, setInitialClientId] = useState('');

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
    if (isCreateMode && !pharmacyId && (isProfileLoading || createLockedStatus))
      return;

    const generation = resourceGenerationRef.current + 1;

    resourceGenerationRef.current = generation;

    const controller = new AbortController();
    const requestOptions = { signal: controller.signal };

    async function loadPage() {
      try {
        if (isCreateMode) {
          const targetPharmacyId = pharmacyId ?? pharmacyProfile?.id;

          if (!targetPharmacyId) {
            throw new Error('Select a pharmacy before creating an order.');
          }

          const [clientsResponse, checkoutDetailsResponse, selectedPharmacy] =
            await Promise.all([
              getPharmacyClients(
                {
                  page: 1,
                  perPage: 200,
                  status: 'active',
                  scope: 'owner',
                  pharmacyId: targetPharmacyId,
                },

                requestOptions
              ),

              getPharmacyCheckoutDetails(targetPharmacyId, requestOptions),
              getOwnedPharmacyDetail(targetPharmacyId, requestOptions),
            ]);

          if (
            selectedPharmacy.pharmacy.status !== 'active' &&
            selectedPharmacy.pharmacy.status !== 'on_moderation'
          ) {
            throw new Error(
              'Order creation is only available for Active or On moderation pharmacies.'
            );
          }

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

            ...(pharmacy.location
              ? { pharmacyLocation: pharmacy.location }
              : {}),

            ...(pharmacy.workingHours
              ? { pharmacyWorkingHours: pharmacy.workingHours }
              : {}),

            ...(pharmacy.email ? { pharmacyEmail: pharmacy.email } : {}),

            ...(pharmacy.bankDetails
              ? { bankDetails: pharmacy.bankDetails }
              : {}),
          };

          setInitialClientId(defaultClient.id);
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
    pharmacyId,
    pharmacyProfile,
  ]);

  useEffect(() => {
    const controller = new AbortController();

    void getProductCategories({ signal: controller.signal })
      .then((categories) => {
        if (!controller.signal.aborted) {
          setCategoryIcons(
            Object.fromEntries(
              categories.map((item) => [item.slug, item.icon ?? ''])
            )
          );
        }
      })
      .catch(() => {
        /* Categories retain their fallback icons. */
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!isCreateMode || !order?.pharmacyName) return;

    dispatchPharmacyBreadcrumbLabel(order.pharmacyName);
  }, [isCreateMode, order?.pharmacyName]);

  useEffect(() => {
    if (isCreateMode || !order?.orderNumber) return;

    dispatchPharmacyBreadcrumbLabel(`Order ${order.orderNumber}`);
  }, [isCreateMode, order?.orderNumber]);

  const historyEntries = useMemo(
    () => (order ? getOrderHistoryEntries(order) : []),
    [order]
  );

  const orderTabs = useMemo(() => getOrderTabs(isCreateMode), [isCreateMode]);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId]
  );

  // The pharmacy explicitly selected in the create URL is validated above.
  // A different globally selected pharmacy must not lock this order draft.
  const isEditable = isCreateMode
    ? Boolean(order && !createLockedStatus)
    : order?.status === 'in_progress' && !pharmacyLockedStatus;

  const isOrderBusy = isUpdatingOrder || isCreatingOrder;

  const deliveryHasChanges = Boolean(
    order &&
    !isCreateMode &&
    (deliveryMethod !== order.deliveryMethod ||
      (deliveryMethod === 'postal_delivery' &&
        (recipientName.trim() !== (order.recipientName ?? order.client) ||
          normalizePhoneInput(recipientPhone) !==
            normalizePhoneInput(
              order.recipientPhone ?? order.clientPhone ?? ''
            ) ||
          deliveryAddress.trim() !==
            (order.deliveryAddress ?? order.clientAddress ?? ''))))
  );

  const paymentHasChanges = Boolean(
    order && !isCreateMode && paymentMethod !== order.paymentMethod
  );

  // An untouched empty draft can be left without a warning.
  const isDirtyDraft = Boolean(
    isCreateMode &&
    order &&
    (order.items.length > 0 ||
      (initialClientId && selectedClientId !== initialClientId) ||
      deliveryMethod !== 'pickup' ||
      paymentMethod !== 'cash' ||
      recipientName !== (selectedClient?.name ?? '') ||
      recipientPhone !==
        (getOptionalClientValue(selectedClient?.phone ?? '') ?? '') ||
      deliveryAddress !==
        (getOptionalClientValue(selectedClient?.address ?? '') ?? ''))
  );

  const {
    allowNavigateRef,
    pendingNavigationRef,
    leaveDialogOpen,
    setLeaveDialogOpen,
  } = useUnsavedPharmacyNavigation(isDirtyDraft);

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

  const hasDraftStockConflict = Boolean(
    isCreateMode &&
    order?.items.some((item) => {
      const available = verifiedDraftStock[item.productOfferId];

      return typeof available === 'number' && item.quantity > available;
    })
  );

  const canSaveCreateOrder = Boolean(
    isCreateMode &&
    isEditable &&
    order &&
    selectedClientId &&
    order.items.length > 0 &&
    order.items.every((item) => item.quantity > 0) &&
    !hasDraftStockConflict &&
    !hasValidationErrors(deliveryErrors) &&
    (paymentMethod !== 'bank_transfer' || order.bankDetails) &&
    !isCreatingOrder &&
    !isUpdatingOrder
  );

  const statusActions = useMemo(() => {
    if (!order || isCreateMode) {
      return [] as Array<PendingStatusChange['status']>;
    }

    return getOrderStatusTransitions(order.status);
  }, [isCreateMode, order]);

  const areStatusActionsDisabled =
    Boolean(pharmacyLockedStatus) || isUpdatingStatus || isUpdatingOrder;

  useEffect(() => {
    if (!isStatusMenuOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!statusMenuRef.current?.contains(event.target as Node)) {
        setIsStatusMenuOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsStatusMenuOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isStatusMenuOpen]);

  const syncOrderState = (updatedOrder: PharmacyOrderDetails) => {
    const formState = getOrderFormState(updatedOrder);

    setIsStatusMenuOpen(false);
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
    if (!order || isCreateMode || pharmacyLockedStatus) return order;

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
        verifiedDraftStock[item.productOfferId] ??
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

      if (quantity < 1) {
        setVerifiedDraftStock((current) => {
          const next = { ...current };
          delete next[item.productOfferId];
          return next;
        });
      }

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

    if (quantity < 1) {
      handleRequestRemoveProduct(item);
      return;
    }

    // A reduction also deserves a warning: any quantity added back later
    // will use the updated price, even though decreasing preserves the old one.
    if (quantity !== item.quantity && hasChangedProductPrice(item)) {
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
    applyQuantityChange(item, 0);
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
      // The product picker has just fetched a fresh offer; forget any old
      // conflict snapshot for the same offer if it was previously removed.
      setVerifiedDraftStock((current) => {
        const next = { ...current };
        delete next[offer.id];
        return next;
      });

      setDraftItems(nextItems);
      return;
    }

    await updateOrderDraft({ items: getOrderItemsPayload(nextItems) });
  };

  const handleClientChange = (
    clientId: string,
    selected?: PharmacyClientRow
  ) => {
    const client = selected ?? clients.find((item) => item.id === clientId);

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
    if (
      areStatusActionsDisabled ||
      !statusActions.some((availableStatus) => availableStatus === status)
    ) {
      return;
    }

    setIsStatusMenuOpen(false);

    if (status === 'rejected') {
      setRejectionReason('');
      setPendingStatus({ status });
      return;
    }

    setPendingStatus({ status });
  };

  const handleConfirmStatus = async () => {
    if (!order || !pendingStatus || isCreateMode || pharmacyLockedStatus)
      return;

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
    if (
      !order ||
      !selectedClientId ||
      !isCreateMode ||
      createPendingRef.current
    )
      return;

    const generation = resourceGenerationRef.current;

    createPendingRef.current = true;
    setIsCreatingOrder(true);

    try {
      const payload: CreateOrderPayloadWithoutRequestId = {
        clientId: selectedClientId,

        items: order.items.map(({ productOfferId, quantity, unitPrice }) => ({
          productOfferId,
          quantity,
          expectedUnitPrice: unitPrice,
        })),

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

      const createdOrder = await createPharmacyOrder(
        {
          ...payload,
          clientRequestId: requestState.clientRequestId,
        },
        order.pharmacyId
      );

      if (resourceGenerationRef.current !== generation) return;

      createOrderRequestRef.current = null;
      setIsCreateConfirmationOpen(false);
      dispatchOrderCounterRefresh();
      toast.success('Order created and moved to In progress.');
      allowNavigateRef.current = true;
      router.replace(getPharmacyOrderPath(createdOrder.id));
    } catch (createError) {
      if (resourceGenerationRef.current !== generation) return;

      const code = isApiError(createError) ? createError.backendCode : null;

      if (
        code === STOCK_CHANGED_ERROR_CODE ||
        code === ORDER_PRICE_CHANGED_ERROR_CODE
      ) {
        const kind = code === STOCK_CHANGED_ERROR_CODE ? 'stock' : 'price';

        // Preserve every draft line even when a product request fails. An
        // unavailable details endpoint must not hide all five ordered items.
        // Each line is refreshed independently; unknown data is never treated
        // as zero stock or as a verified price.
        const checks = await Promise.all(
          order.items.map(
            async (
              item
            ): Promise<{
              detail: OrderCreateConflictDetail;
              refreshedItem: PharmacyOrderItem | null;
              availableStock: number | null;
            }> => {
              const baseDetail = {
                productId: item.productId,
                productOfferId: item.productOfferId,
                name: item.name,
                imageUrl: item.imageUrl,
              };

              try {
                const { product } = await getOrderProductDetails(
                  item.productId,
                  order.pharmacyId
                );

                const offer = getProductOffer(product, order.pharmacyId);

                if (!offer || offer.id !== item.productOfferId) {
                  return {
                    detail: {
                      ...baseDetail,

                      messages: [
                        `Requested ${item.quantity}. This pharmacy offer is no longer available for verification.`,
                      ],
                    },

                    refreshedItem: null,
                    availableStock: 0,
                  };
                }

                const available = offer.availableQuantity;

                // Keep the manager's requested quantity even if available is
                // zero. The line remains in the draft with an inline warning
                // until the manager decreases or explicitly removes it.
                const quantity = item.quantity;
                const price = offer.price;

                const messages = [
                  `Requested ${item.quantity}, available ${available}.`,
                ];

                if (price !== item.unitPrice) {
                  messages.push(
                    `Price: ${formatMoney(item.unitPrice) ?? '—'} → ${formatMoney(price) ?? '—'}.`
                  );
                }

                return {
                  detail: { ...baseDetail, messages },

                  refreshedItem: {
                    ...item,
                    quantity,
                    unitPrice: price,
                    currentPrice: price,
                    availableQuantity: Math.max(0, available - quantity),
                  },

                  availableStock: available,
                };
              } catch {
                return {
                  detail: {
                    ...baseDetail,

                    messages: [
                      `Requested ${item.quantity}. Current stock and price could not be verified.`,
                    ],
                  },

                  refreshedItem: null,
                  availableStock: null,
                };
              }
            }
          )
        );

        if (resourceGenerationRef.current !== generation) return;

        const details = checks.map(({ detail }) => detail);

        // Refresh only confirmed stock values, including verified zeroes.
        // Individual fetch failures are represented as unknown, never zero.
        setVerifiedDraftStock((current) => ({
          ...current,

          ...Object.fromEntries(
            checks.map(({ detail, availableStock }) => [
              detail.productOfferId,
              availableStock,
            ])
          ),
        }));

        const refreshedItems: PharmacyOrderItem[] | null = checks.every(
          ({ refreshedItem }) => refreshedItem !== null
        )
          ? checks.flatMap(({ refreshedItem }) =>
              refreshedItem ? [refreshedItem] : []
            )
          : null;

        if (resourceGenerationRef.current !== generation) return;

        setIsCreateConfirmationOpen(false);
        setCreateConflict({ kind, details, refreshedItems });
      } else {
        toast.error(
          getSafeApiErrorMessage(
            createError,
            'Could not create the order. Check your pharmacy selection and try again.',
            {
              backendMessages: {
                PHARMACY_SELECTION_REQUIRED:
                  'The pharmacy for this order was not selected. Reopen the order from the correct pharmacy.',

                ORDER_CLIENT_NOT_CONNECTED:
                  'This client is not connected to the selected pharmacy. Choose a client from this pharmacy.',

                ORDER_CLIENT_UNAVAILABLE:
                  'This client is no longer active or available. Select another active client.',

                MANAGER_ORDER_REQUEST_REUSED:
                  'This order submission was already processed with different details. Reload the form before creating another order.',

                PAYMENT_METHOD_UNAVAILABLE:
                  'Bank transfer is unavailable for this pharmacy. Choose another payment method.',
              },

              statusMessages: {
                400: 'The order details or selected client are not valid. Review the form and try again.',
                409: 'The order could not be saved because some data changed. Check the client, quantities and prices, then try again.',
                500: 'The server could not finish creating this order. Your draft is preserved. Please try again.',
              },
            }
          )
        );
      }
    } finally {
      createPendingRef.current = false;
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
                createLockedStatus === 'blocked'
                  ? 'Your pharmacy is temporarily blocked. Creating orders is disabled until Admin restores access.'
                  : createLockedStatus === 'on_verification'
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
    return isCreateMode ? (
      <main className={css.page} aria-label="Preparing order">
        <section className={css.contentCard}>
          <div className={css.loaderBox}>
            <LoadingSpinner label="Preparing order..." />
          </div>
        </section>
      </main>
    ) : (
      <OrderDetailsLoadingSkeleton tab={activeTab} />
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
              <NewOrderClientSearch
                pharmacyId={order.pharmacyId}
                value={selectedClientId}
                selectedClient={selectedClient}
                onSelect={(client) => {
                  if (client) {
                    setClients((current) =>
                      current.some((item) => item.id === client.id)
                        ? current
                        : [...current, client]
                    );
                    handleClientChange(client.id, client);
                  }
                }}
                disabled={isCreatingOrder}
              />
            </div>

            {selectedClient ? (
              <OrderClientBadge
                clientId={selectedClient.id}
                name={selectedClient.name}
                photoUrl={selectedClient.photoUrl}
              />
            ) : null}

            <Button
              className={css.saveOrderButton}
              type="button"
              variant="secondary"
              iconLeft={<Save size={17} aria-hidden="true" />}
              disabled={!canSaveCreateOrder}
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
            </div>

            <div
              className={`${css.clientStatusRow} ${
                statusActions.length > 0
                  ? css.clientStatusRowWithActions
                  : css.clientStatusRowClientOnly
              }`}
            >
              {statusActions.length > 0 ? (
                <div className={css.statusActions}>
                  <div className={css.statusMenu} ref={statusMenuRef}>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      aria-haspopup="menu"
                      aria-expanded={isStatusMenuOpen}
                      aria-controls="order-status-actions-menu"
                      iconLeft={<ClipboardCheck size={17} aria-hidden="true" />}
                      disabled={areStatusActionsDisabled}
                      onClick={() => setIsStatusMenuOpen((open) => !open)}
                    >
                      Manage order status
                      <ChevronDown size={16} aria-hidden="true" />
                    </Button>

                    {isStatusMenuOpen ? (
                      <div
                        id="order-status-actions-menu"
                        className={css.statusMenuOptions}
                        role="menu"
                        aria-label="Available order status actions"
                      >
                        {statusActions.map((status) => (
                          <button
                            key={status}
                            type="button"
                            role="menuitem"
                            className={
                              status === 'rejected'
                                ? css.rejectStatusAction
                                : css.approveStatusAction
                            }
                            disabled={areStatusActionsDisabled}
                            onClick={() => handleStatusClick(status)}
                          >
                            {status === 'in_progress' ? (
                              <CirclePlay size={17} aria-hidden="true" />
                            ) : status === 'successful' ? (
                              <CircleCheckBig size={17} aria-hidden="true" />
                            ) : (
                              <CircleX size={17} aria-hidden="true" />
                            )}
                            {getStatusActionLabel(status)}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className={css.detailsClientBadge}>
                {order.clientId ? (
                  <OrderClientBadge
                    clientId={order.clientId}
                    name={order.client || 'Client'}
                    photoUrl={order.clientPhotoUrl}
                  />
                ) : null}
              </div>
            </div>
          </div>
        )}

        {isCreateMode ? (
          <StatusBanner
            tone="neutral"
            label="Draft"
            title="This is an unsaved order draft"
            message="Saving it reserves the selected products and immediately moves the order to In progress."
            className={css.statusBanner}
          />
        ) : (
          <div className={css.statusStack}>
            {pharmacyLockedStatus ? (
              <StatusBanner
                {...PHARMACY_STATUS_PRESENTATION[pharmacyLockedStatus]}
                title={
                  pharmacyLockedStatus === 'blocked'
                    ? 'Pharmacy access is temporarily restricted'
                    : 'Verification is required'
                }
                message={
                  pharmacyLockedStatus === 'blocked'
                    ? 'This order remains available for review, but editing, status changes, and manager comment mutations are disabled until Admin restores access.'
                    : pharmacyLockedStatus === 'on_verification'
                      ? 'Order mutations are paused while Admin verifies the pharmacy profile.'
                      : 'Order mutations become available after Admin verifies the pharmacy profile.'
                }
                className={css.statusBanner}
              />
            ) : null}

            <StatusBanner
              {...ORDER_STATUS_PRESENTATION[order.status]}
              {...getOrderStatusSummary(order.status)}
              inlineMeta
              labelSupplement={
                <OrderRejectionSourceBadge
                  status={order.status}
                  rejectedByType={order.rejectedByType}
                />
              }
              headerMeta={
                <span className={css.orderHeaderMeta}>
                  <Clock size={16} aria-hidden="true" />
                  Created {formatOrderCreatedAt(order.orderDate)}
                </span>
              }
              meta={
                <OrderPharmacyBadge
                  pharmacyId={order.pharmacyId}
                  name={order.pharmacyName}
                  imageUrl={order.pharmacyImageUrl}
                />
              }
              className={css.statusBanner}
            />
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
            onChange={(tab) => {
              if (isCreateMode) {
                setActiveTab(tab);
              } else {
                window.history.pushState(
                  null,
                  '',
                  getPharmacyOrderTabPath(order.id, tab)
                );
              }
            }}
          />
        </div>

        <div className={css.tabPanel}>
          {activeTab === 'products' ? (
            <OrderProductsTab
              order={order}
              categoryIcons={categoryIcons}
              verifiedDraftStock={isCreateMode ? verifiedDraftStock : {}}
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
              isCreateMode={isCreateMode}
              isEditable={isEditable}
              deliveryMethod={deliveryMethod}
              recipientName={recipientName}
              recipientPhone={recipientPhone}
              deliveryAddress={deliveryAddress}
              deliveryErrors={deliveryErrors}
              deliveryTouchedFields={deliveryTouchedFields}
              isUpdating={isOrderBusy}
              hasChanges={deliveryHasChanges}
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
              isCreateMode={isCreateMode}
              paymentMethod={paymentMethod}
              isEditable={isEditable}
              isUpdating={isOrderBusy}
              hasChanges={paymentHasChanges}
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
                rejectedByType={order.rejectedByType}
              />
            )
          ) : null}
        </div>
      </section>

      <ConfirmationModal
        isOpen={isCreateConfirmationOpen}
        eyebrow="CREATE ORDER"
        title="Create this order?"
        confirmIconLeft={<CircleCheckBig size={17} aria-hidden="true" />}
        cancelIconLeft={<X size={17} aria-hidden="true" />}
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

      <OrderCreateConflictModal
        conflict={createConflict}
        onConfirm={() => {
          if (createConflict?.refreshedItems)
            setDraftItems(createConflict.refreshedItems);

          setActiveTab('products');
          setCreateConflict(null);
        }}
        onCancel={() => setCreateConflict(null)}
      />

      <ConfirmationModal
        isOpen={leaveDialogOpen}
        eyebrow="UNSAVED CHANGES"
        title="Leave order editor?"
        description="Your unsaved order, including the selected products and delivery details, will be lost."
        confirmLabel="Leave page"
        cancelLabel="Keep editing"
        confirmIconLeft={<LogOut size={17} aria-hidden="true" />}
        cancelIconLeft={<X size={17} aria-hidden="true" />}
        destructive
        onCancel={() => {
          pendingNavigationRef.current = null;
          setLeaveDialogOpen(false);
        }}
        onConfirm={() => {
          setLeaveDialogOpen(false);

          const navigate = pendingNavigationRef.current;

          pendingNavigationRef.current = null;
          navigate?.();
        }}
      />

      <OrderPriceChangeModal
        change={
          pendingPriceQuantityChange
            ? {
                item: pendingPriceQuantityChange.item,
                action:
                  pendingPriceQuantityChange.quantity <
                  pendingPriceQuantityChange.item.quantity
                    ? 'decrease'
                    : 'increase',
                nextQuantity: pendingPriceQuantityChange.quantity,
              }
            : null
        }
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

      <OrderPriceChangeModal
        change={
          productToRemove && hasChangedProductPrice(productToRemove)
            ? { item: productToRemove, action: 'remove' }
            : null
        }
        isLoading={isOrderBusy}
        onConfirm={handleConfirmRemoveProduct}
        onCancel={() => {
          if (!isOrderBusy) setProductToRemove(null);
        }}
      />

      <ConfirmationModal
        isOpen={Boolean(
          productToRemove && !hasChangedProductPrice(productToRemove)
        )}
        title="Remove product from order?"
        eyebrow="ORDER PRODUCTS"
        destructive
        confirmIconLeft={<Trash2 size={17} aria-hidden="true" />}
        cancelIconLeft={<X size={17} aria-hidden="true" />}
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
        eyebrow="ORDER STATUS"
        title={statusModalText?.title ?? 'Update order status?'}
        description={statusModalText?.description ?? ''}
        confirmIconLeft={<CircleCheckBig size={17} aria-hidden="true" />}
        cancelIconLeft={<X size={17} aria-hidden="true" />}
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
