'use client';

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Clock,
  Copy,
  CreditCard,
  Info,
  Mail,
  ShieldAlert,
  MapPin,
  Phone,
  Truck,
  Wallet,
} from 'lucide-react';

import {
  Button,
  ButtonLink,
  Container,
  LoadingSpinner,
  RadioOption,
} from '@/components/common';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { useAuth } from '@/providers';

import { CHECKOUT_DESCRIPTION, CHECKOUT_TITLE } from '@/lib/constants/metadata';
import { ROUTES } from '@/lib/constants/routes';
import {
  CUSTOMER_ADDRESS_MAX_LENGTH,
  CUSTOMER_ADDRESS_MIN_LENGTH,
  CUSTOMER_NAME_MAX_LENGTH,
  CUSTOMER_PHONE_MAX_LENGTH,
  getCustomerAddressError,
  getCustomerNameError,
  getCustomerPhoneError,
  sanitizeCustomerAddress,
  sanitizeCustomerName,
  sanitizeCustomerPhone,
} from '@/lib/validations';

import { checkoutOrder, getCart, getStoreDetails } from '@/services';
import { dispatchCartUpdated } from '@/lib/cart-events';
import { buildCustomerOrderPath } from '@/lib/orders';

import type { BreadcrumbItem, Cart, Store } from '@/types';

import css from './CheckoutPageContent.module.css';

//===================================================================

type PaymentMethod = 'cash' | 'bank-transfer';
type DeliveryMethod = 'pickup' | 'post';

type StoreOrderGroup = {
  storeId: string;
  storeName: string;
  items: Cart['items'];
  totalItems: number;
  totalPrice: number;
};

type CheckoutPageContentProps = {
  checkoutStoreId?: string;
};

type CheckoutBankDetails = NonNullable<Store['bankDetails']>;

//===================================================================

const EMPTY_CART: Cart = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
};

const CHECKOUT_BREADCRUMBS: BreadcrumbItem[] = [
  { label: 'Home', href: ROUTES.HOME },
  { label: 'Cart', href: ROUTES.CART },
  { label: CHECKOUT_TITLE },
];

//===================================================================

function formatPrice(price: number): string {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    maximumFractionDigits: 0,
  }).format(price);
}

function groupCartByStore(cart: Cart): StoreOrderGroup[] {
  const groups = new Map<string, StoreOrderGroup>();

  for (const item of cart.items) {
    const storeName = item.storeName || item.product.storeName || 'Pharmacy';
    const group = groups.get(item.storeId);

    if (group) {
      group.items.push(item);
      group.totalItems += item.quantity;
      group.totalPrice += item.totalPrice;
      continue;
    }

    groups.set(item.storeId, {
      storeId: item.storeId,
      storeName,
      items: [item],
      totalItems: item.quantity,
      totalPrice: item.totalPrice,
    });
  }

  return [...groups.values()];
}

function getStoreEmail(store?: Store | null): string {
  return store?.email ?? 'pharmacy@example.com';
}

function getStorePhone(store?: Store | null): string {
  return store?.phone ?? '+380 50 100 00 00';
}

function getStoreWorkingHours(store?: Store | null): string {
  return store?.workingHours ?? 'Mon–Fri 08:00–21:00, Sat–Sun 09:00–18:00';
}

function getStoreAddress(store?: Store | null): string {
  if (!store) return 'Address will be confirmed by the pharmacy.';

  return [store.address, store.city].filter(Boolean).join(', ');
}

function getBankDetails(store?: Store | null): CheckoutBankDetails {
  return (
    store?.bankDetails ?? {
      recipientName: `${store?.name ?? 'E-PHARMACY partner'} LLC`,
      taxId: '12345678',
      iban: 'UA123456789012345678901234567',
      bankName: 'JSC PrivatBank',
      paymentPurpose: `Payment for E-PHARMACY invoice from ${store?.name ?? 'pharmacy'}`,
    }
  );
}

function getStockValidationError(group: StoreOrderGroup): string {
  const unavailableItems = group.items.filter(
    (item) => item.stockQuantity <= 0 || item.quantity > item.stockQuantity
  );

  if (unavailableItems.length === 0) return '';

  const productNames = unavailableItems
    .map((item) => item.product.name)
    .slice(0, 3)
    .join(', ');

  return `Sorry, we cannot confirm this invoice right now. While you were placing the order, ${productNames} ${
    unavailableItems.length === 1 ? 'was' : 'were'
  } reserved by another customer. Please update the cart and choose the available quantity again.`;
}

//===================================================================

function CheckoutPageContent({ checkoutStoreId }: CheckoutPageContentProps) {
  const { token, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryStoreId = searchParams.get('storeId');
  const selectedStoreIdFromRoute = checkoutStoreId ?? queryStoreId;

  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [store, setStore] = useState<Store | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>('pickup');
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [recipientPhone, setRecipientPhone] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isStoreLoading, setIsStoreLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const orderGroups = useMemo(() => groupCartByStore(cart), [cart]);
  const selectedOrderGroup = useMemo(() => {
    if (orderGroups.length === 0) return null;

    return (
      orderGroups.find((group) => group.storeId === selectedStoreIdFromRoute) ??
      orderGroups[0]
    );
  }, [selectedStoreIdFromRoute, orderGroups]);

  const recipientNameValue = recipientName ?? user?.name ?? '';
  const recipientPhoneValue = recipientPhone ?? user?.phone ?? '';
  const deliveryAddressValue = deliveryAddress ?? user?.address ?? '';

  const nameError = getCustomerNameError(recipientNameValue);
  const phoneError = getCustomerPhoneError(recipientPhoneValue);
  const addressError = getCustomerAddressError(deliveryAddressValue);
  const isPostDeliveryValid =
    deliveryMethod === 'pickup' ||
    (recipientNameValue.trim().length >= 2 &&
      recipientNameValue.trim().length <= CUSTOMER_NAME_MAX_LENGTH &&
      recipientPhoneValue.trim().length === CUSTOMER_PHONE_MAX_LENGTH &&
      deliveryAddressValue.trim().length >= CUSTOMER_ADDRESS_MIN_LENGTH &&
      deliveryAddressValue.trim().length <= CUSTOMER_ADDRESS_MAX_LENGTH &&
      !nameError &&
      !phoneError &&
      !addressError);

  const canSubmit =
    Boolean(selectedOrderGroup) && isPostDeliveryValid && !isSubmitting;
  const storeEmail = getStoreEmail(store);
  const bankDetails = getBankDetails(store);

  useEffect(() => {
    const authToken = token;

    let isMounted = true;

    async function fetchCart() {
      if (!authToken) return;

      try {
        const response = await getCart(authToken);

        if (!isMounted) return;

        setCart(response.cart);
        setError('');
      } catch {
        if (!isMounted) return;

        setError('Could not load checkout data.');
      } finally {
        if (!isMounted) return;

        setIsLoading(false);
      }
    }

    void fetchCart();

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    let isMounted = true;

    async function fetchStore() {
      if (!selectedOrderGroup) return;

      try {
        setIsStoreLoading(true);
        const response = await getStoreDetails(
          selectedOrderGroup.storeId,
          token ?? undefined
        );

        if (!isMounted) return;

        setStore(response.store);
      } catch {
        if (!isMounted) return;

        setStore(null);
      } finally {
        if (!isMounted) return;

        setIsStoreLoading(false);
      }
    }

    void fetchStore();

    return () => {
      isMounted = false;
    };
  }, [selectedOrderGroup, token]);

  const handleRecipientNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setRecipientName(sanitizeCustomerName(event.target.value));
  };

  const handleRecipientPhoneChange = (event: ChangeEvent<HTMLInputElement>) => {
    setRecipientPhone(sanitizeCustomerPhone(event.target.value));
  };

  const handleDeliveryAddressChange = (
    event: ChangeEvent<HTMLTextAreaElement>
  ) => {
    setDeliveryAddress(sanitizeCustomerAddress(event.target.value));
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(storeEmail);
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 1800);
    } catch {
      setCopiedEmail(false);
    }
  };

  const handleSubmit = async () => {
    const authToken = token;

    if (!authToken || !canSubmit) return;

    try {
      setIsSubmitting(true);
      setError('');

      if (!selectedOrderGroup) return;

      const latestCartResponse = await getCart(authToken);
      const latestGroups = groupCartByStore(latestCartResponse.cart);
      const latestOrderGroup = latestGroups.find(
        (group) => group.storeId === selectedOrderGroup.storeId
      );

      if (!latestOrderGroup) {
        setCart(latestCartResponse.cart);
        setError(
          'Sorry, we cannot confirm this invoice right now. While you were placing the order, these products were reserved by another customer. Please update the cart and try again.'
        );
        return;
      }

      const stockError = getStockValidationError(latestOrderGroup);

      if (stockError) {
        setCart(latestCartResponse.cart);
        setError(stockError);
        return;
      }

      const response = await checkoutOrder(
        {
          storeId: latestOrderGroup.storeId,
          paymentMethod,
          deliveryMethod,
          ...(deliveryMethod === 'post'
            ? {
                deliveryDetails: {
                  recipientName: recipientNameValue.trim(),
                  recipientPhone: recipientPhoneValue.trim(),
                  address: deliveryAddressValue.trim(),
                },
              }
            : {}),
          ...(comment.trim() ? { comment: comment.trim() } : {}),
        },
        authToken
      );
      const nextCartResponse = await getCart(authToken);

      setCart(nextCartResponse.cart);
      dispatchCartUpdated(nextCartResponse.cart);
      router.push(buildCustomerOrderPath(response.order));
    } catch {
      setError('Could not confirm order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nonReturnableNotice = (
    <div className={css.policyNotice}>
      <ShieldAlert size={20} aria-hidden="true" />
      <p>
        Medicines and pharmacy products are non-returnable and non-exchangeable
        after confirmation. Please check the invoice carefully before payment.
      </p>
    </div>
  );

  return (
    <main className={css.page}>
      <section className={css.section} aria-labelledby="checkout-title">
        <Container>
          <Breadcrumbs items={CHECKOUT_BREADCRUMBS} />

          <div className={css.hero}>
            <h1 className={css.title} id="checkout-title">
              {CHECKOUT_TITLE}
            </h1>
            <p className={css.text}>{CHECKOUT_DESCRIPTION}</p>
          </div>

          {isLoading ? (
            <div className={css.status}>
              <LoadingSpinner label="Loading checkout invoice..." />
            </div>
          ) : null}

          {error ? (
            <div className={css.notice} role="alert">
              {error}
            </div>
          ) : null}

          {!isLoading && cart.items.length === 0 ? (
            <div className={css.empty}>
              <h2 className={css.emptyTitle}>Your cart is empty</h2>
              <p className={css.emptyText}>
                Add medicines first, then checkout will form pharmacy invoices.
              </p>
              <div className={css.successActions}>
                <ButtonLink href={ROUTES.CART} variant="secondary">
                  Back to cart
                </ButtonLink>

                <ButtonLink href={ROUTES.MEDICINES_CATALOG}>
                  Browse medicines
                </ButtonLink>
              </div>
            </div>
          ) : null}

          {selectedOrderGroup ? (
            <div className={css.grid}>
              <div className={css.leftColumn}>
                <section className={css.card} aria-labelledby="delivery-title">
                  <h2 className={css.cardTitle} id="delivery-title">
                    Delivery method
                  </h2>

                  <div className={css.choiceGrid}>
                    <div className={css.optionsGrid}>
                      <RadioOption
                        name="delivery"
                        value="pickup"
                        checked={deliveryMethod === 'pickup'}
                        label="Pickup from pharmacy"
                        onChange={setDeliveryMethod}
                      />

                      <RadioOption
                        name="delivery"
                        value="post"
                        checked={deliveryMethod === 'post'}
                        label="Post delivery"
                        onChange={setDeliveryMethod}
                      />
                    </div>

                    <div className={css.detailsPanel}>
                      {deliveryMethod === 'pickup' ? (
                        <div className={css.infoCard}>
                          <h3 className={css.infoTitle}>Pharmacy details</h3>
                          {isStoreLoading ? (
                            <p className={css.mutedText}>
                              Loading pharmacy details...
                            </p>
                          ) : null}
                          <ul className={css.iconList}>
                            <li>
                              <Phone size={18} aria-hidden="true" />
                              <a href={`tel:${getStorePhone(store)}`}>
                                {getStorePhone(store)}
                              </a>
                            </li>
                            <li>
                              <Clock size={18} aria-hidden="true" />
                              <span>{getStoreWorkingHours(store)}</span>
                            </li>
                            <li>
                              <MapPin size={18} aria-hidden="true" />
                              <span>{getStoreAddress(store)}</span>
                            </li>
                          </ul>
                        </div>
                      ) : (
                        <div className={css.deliveryFields}>
                          <div className={css.fieldsGrid}>
                            <label className={css.field}>
                              <span className={css.fieldLabel}>Name</span>
                              <span className={css.controlWrap}>
                                <input
                                  value={recipientNameValue}
                                  placeholder="Your name"
                                  autoComplete="name"
                                  maxLength={CUSTOMER_NAME_MAX_LENGTH}
                                  aria-invalid={Boolean(nameError)}
                                  aria-describedby="recipient-name-error"
                                  onChange={handleRecipientNameChange}
                                />
                                <span className={css.inputCounter}>
                                  {recipientNameValue.length}/
                                  {CUSTOMER_NAME_MAX_LENGTH}
                                </span>
                                <span
                                  className={css.errorText}
                                  id="recipient-name-error"
                                  aria-live="polite"
                                >
                                  {nameError}
                                </span>
                              </span>
                            </label>

                            <label className={css.field}>
                              <span className={css.fieldLabel}>Phone</span>
                              <span className={css.controlWrap}>
                                <input
                                  value={recipientPhoneValue}
                                  placeholder="+380..."
                                  autoComplete="tel"
                                  maxLength={CUSTOMER_PHONE_MAX_LENGTH}
                                  aria-invalid={Boolean(phoneError)}
                                  aria-describedby="recipient-phone-error"
                                  onChange={handleRecipientPhoneChange}
                                />
                                <span className={css.inputCounter}>
                                  {recipientPhoneValue.length}/
                                  {CUSTOMER_PHONE_MAX_LENGTH}
                                </span>
                                <span
                                  className={css.errorText}
                                  id="recipient-phone-error"
                                  aria-live="polite"
                                >
                                  {phoneError}
                                </span>
                              </span>
                            </label>

                            <label className={css.fieldWide}>
                              <span className={css.fieldLabel}>
                                Delivery address / post office
                              </span>
                              <span className={css.controlWrap}>
                                <textarea
                                  value={deliveryAddressValue}
                                  placeholder="Example: 12 Central Street, Nova Poshta office #5, Kyiv"
                                  autoComplete="street-address"
                                  maxLength={CUSTOMER_ADDRESS_MAX_LENGTH}
                                  aria-invalid={Boolean(addressError)}
                                  aria-describedby="delivery-address-error"
                                  onChange={handleDeliveryAddressChange}
                                />
                                <span className={css.textareaCounter}>
                                  {deliveryAddressValue.length}/
                                  {CUSTOMER_ADDRESS_MAX_LENGTH}
                                </span>
                                <span
                                  className={css.errorTextTextarea}
                                  id="delivery-address-error"
                                  aria-live="polite"
                                >
                                  {addressError}
                                </span>
                              </span>
                            </label>
                          </div>

                          <div className={css.deliveryNotes}>
                            <div className={css.noteCard}>
                              <Truck size={18} aria-hidden="true" />
                              <p>
                                After confirmation, the pharmacy will contact
                                you to confirm or clarify the delivery address.
                              </p>
                            </div>

                            <div className={css.noteCardAccent}>
                              <Info size={18} aria-hidden="true" />
                              <p>
                                Delivery is not included in the product price.
                                The carrier will announce the delivery cost
                                separately.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <section className={css.card} aria-labelledby="payment-title">
                  <h2 className={css.cardTitle} id="payment-title">
                    Payment method
                  </h2>

                  <div className={css.choiceGrid}>
                    <div className={css.optionsGrid}>
                      <RadioOption
                        name="payment"
                        value="cash"
                        checked={paymentMethod === 'cash'}
                        label="Cash on pickup / delivery"
                        onChange={setPaymentMethod}
                      />

                      <RadioOption
                        name="payment"
                        value="bank-transfer"
                        checked={paymentMethod === 'bank-transfer'}
                        label="Bank transfer"
                        onChange={setPaymentMethod}
                      />
                    </div>

                    <div className={css.detailsPanel}>
                      {paymentMethod === 'cash' ? (
                        <div className={css.infoCard}>
                          <Wallet size={20} aria-hidden="true" />
                          <h3 className={css.infoTitle}>
                            Pay when everything is ready
                          </h3>
                          <p className={css.mutedText}>
                            Cash is paid during pickup or delivery. Please keep
                            the invoice amount ready when you receive the order.
                          </p>
                        </div>
                      ) : (
                        <div className={css.bankCard}>
                          <CreditCard size={20} aria-hidden="true" />
                          <h3 className={css.infoTitle}>Bank details</h3>
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

                          <div className={css.emailNote}>
                            <Mail size={18} aria-hidden="true" />
                            <p>
                              After payment, send the receipt to the pharmacy
                              email for faster processing.
                            </p>
                            <button
                              className={css.copyButton}
                              type="button"
                              onClick={() => void handleCopyEmail()}
                            >
                              <span>{storeEmail}</span>
                              <Copy size={16} aria-hidden="true" />
                            </button>
                            {copiedEmail ? (
                              <span className={css.copiedText}>Copied</span>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <section className={css.card} aria-labelledby="comment-title">
                  <h2 className={css.cardTitle} id="comment-title">
                    Order comment
                  </h2>
                  <label className={css.fieldWide}>
                    <span className={css.fieldLabel}>Comment for pharmacy</span>
                    <span className={css.controlWrap}>
                      <textarea
                        className={css.commentTextarea}
                        value={comment}
                        maxLength={500}
                        placeholder="Add details for the pharmacy if needed"
                        onChange={(event) => setComment(event.target.value)}
                      />
                      <span className={css.textareaCounter}>
                        {comment.length}/500
                      </span>
                    </span>
                  </label>
                </section>
              </div>

              <aside className={css.summary} aria-labelledby="summary-title">
                <h2 className={css.cardTitle} id="summary-title">
                  Pharmacy invoice
                </h2>

                <ul className={css.invoiceList}>
                  {[selectedOrderGroup].map((group) => (
                    <li className={css.invoiceCard} key={group.storeId}>
                      <h3>{group.storeName}</h3>
                      <p>{group.totalItems} items</p>
                      <p className={css.invoiceTotal}>
                        {formatPrice(group.totalPrice)}
                      </p>
                    </li>
                  ))}
                </ul>

                {nonReturnableNotice}

                <dl className={css.totalList}>
                  <div>
                    <dt>Total items</dt>
                    <dd>{selectedOrderGroup.totalItems}</dd>
                  </div>
                  <div>
                    <dt>Total</dt>
                    <dd>{formatPrice(selectedOrderGroup.totalPrice)}</dd>
                  </div>
                </dl>

                <Button
                  type="button"
                  fullWidth
                  disabled={!canSubmit}
                  onClick={() => void handleSubmit()}
                >
                  {isSubmitting ? 'Confirming...' : 'Confirm invoice'}
                </Button>
              </aside>
            </div>
          ) : null}
        </Container>
      </section>
    </main>
  );
}

export default CheckoutPageContent;
