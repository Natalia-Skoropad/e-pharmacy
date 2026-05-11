'use client';

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { Clock, Copy, CreditCard, Mail, MapPin, Phone, Truck, Wallet } from 'lucide-react';

import {
  Button,
  ButtonLink,
  Container,
  LoadingSpinner,
  RadioOption,
} from '@/components/common';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { useAuth } from '@/components/providers';

import { CHECKOUT_DESCRIPTION, CHECKOUT_TITLE } from '@/lib/constants/metadata';
import { ROUTES } from '@/lib/constants/routes';

import { getCart, getStoreDetails, removeCartItem } from '@/services';

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

const LATIN_ADDRESS_PATTERN = /^[A-Za-z0-9\s.,'’/#-]+$/;
const ADDRESS_MAX_LENGTH = 200;
const ADDRESS_MIN_LENGTH = 20;

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

function sanitizeLatinAddress(value: string): string {
  return value.replace(/[^A-Za-z0-9\s.,'’/#-]/g, '').slice(0, ADDRESS_MAX_LENGTH);
}

function getAddressError(address: string): string {
  const trimmedAddress = address.trim();

  if (trimmedAddress.length === 0) return '';

  if (trimmedAddress.length < ADDRESS_MIN_LENGTH) {
    return `Address must be at least ${ADDRESS_MIN_LENGTH} characters.`;
  }

  if (!LATIN_ADDRESS_PATTERN.test(trimmedAddress)) {
    return 'Use Latin letters, numbers, spaces, comma, dot, slash, apostrophe, # or hyphen.';
  }

  return '';
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

//===================================================================

function CheckoutPageContent({ checkoutStoreId }: CheckoutPageContentProps) {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const queryStoreId = searchParams.get('storeId');
  const selectedStoreIdFromRoute = checkoutStoreId ?? queryStoreId;

  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [store, setStore] = useState<Store | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>('pickup');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [comment, setComment] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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

  const addressError = getAddressError(deliveryAddress);
  const isPostDeliveryValid =
    deliveryMethod === 'pickup' ||
    (recipientName.trim().length >= 2 &&
      recipientPhone.trim().length >= 6 &&
      deliveryAddress.trim().length >= ADDRESS_MIN_LENGTH &&
      deliveryAddress.trim().length <= ADDRESS_MAX_LENGTH &&
      !addressError);

  const canSubmit =
    Boolean(selectedOrderGroup) && isPostDeliveryValid && !isSubmitting;
  const storeEmail = getStoreEmail(store);
  const bankDetails = getBankDetails(store);

  useEffect(() => {
    let isMounted = true;

    async function fetchCart() {
      if (!token) return;

      try {
        const response = await getCart(token);

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

  const handleDeliveryAddressChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setDeliveryAddress(sanitizeLatinAddress(event.target.value));
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
    if (!token || !canSubmit) return;

    try {
      setIsSubmitting(true);
      setError('');

      if (!selectedOrderGroup) return;

      let nextCart = cart;

      for (const item of selectedOrderGroup.items) {
        const response = await removeCartItem(item.id, token);
        nextCart = response.cart;
      }

      setCart(nextCart);
      setSuccessMessage(
        `Invoice from ${selectedOrderGroup.storeName} accepted with status “Accepted”.`
      );
    } catch {
      setError('Could not confirm order.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

          {successMessage ? (
            <div className={css.success} role="status">
              <h2 className={css.successTitle}>{successMessage}</h2>
              <p className={css.successText}>
                The pharmacy will check the invoice and contact you if anything needs
                a tiny detective moment. Paperwork goblin has been politely escorted
                to the backend queue.
              </p>
              <div className={css.successActions}>
                <ButtonLink href={ROUTES.CART} variant="secondary">
                  Back to cart
                </ButtonLink>

                <ButtonLink href={ROUTES.MEDICINES_CATALOG}>
                  Back to catalog
                </ButtonLink>
              </div>
            </div>
          ) : null}

          {!isLoading && !successMessage && cart.items.length === 0 ? (
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

          {!successMessage && selectedOrderGroup ? (
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
                            <p className={css.mutedText}>Loading pharmacy details...</p>
                          ) : null}
                          <ul className={css.iconList}>
                            <li>
                              <Phone size={18} aria-hidden="true" />
                              <a href={`tel:${getStorePhone(store)}`}>{getStorePhone(store)}</a>
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
                              <span>Name</span>
                              <input
                                value={recipientName}
                                placeholder="Your name"
                                autoComplete="name"
                                maxLength={80}
                                onChange={(event) =>
                                  setRecipientName(event.target.value)
                                }
                              />
                            </label>

                            <label className={css.field}>
                              <span>Phone</span>
                              <input
                                value={recipientPhone}
                                placeholder="+380..."
                                autoComplete="tel"
                                maxLength={32}
                                onChange={(event) =>
                                  setRecipientPhone(event.target.value)
                                }
                              />
                            </label>

                            <label className={css.fieldWide}>
                              <span>Delivery address / post office</span>
                              <input
                                value={deliveryAddress}
                                placeholder="Example: 12 Central Street, Nova Poshta office #5, Kyiv"
                                autoComplete="street-address"
                                maxLength={ADDRESS_MAX_LENGTH}
                                aria-invalid={Boolean(addressError)}
                                aria-describedby={
                                  addressError ? 'delivery-address-error' : undefined
                                }
                                onChange={handleDeliveryAddressChange}
                              />
                            </label>
                          </div>

                          <div className={css.fieldMeta}>
                            <span>
                              {deliveryAddress.length}/{ADDRESS_MAX_LENGTH}
                            </span>
                            {addressError ? (
                              <span className={css.errorText} id="delivery-address-error">
                                {addressError}
                              </span>
                            ) : null}
                          </div>

                          <div className={css.noteCard}>
                            <Truck size={18} aria-hidden="true" />
                            <p>
                              After confirmation, the pharmacy will contact you to
                              confirm or clarify the delivery address. Delivery is not
                              included in the product price, and the carrier will announce
                              the delivery cost separately.
                            </p>
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
                          <h3 className={css.infoTitle}>Pay when everything is ready</h3>
                          <p className={css.mutedText}>
                            Cash is paid during pickup or delivery. No secret pharmacy
                            treasure map needed — just keep the invoice amount nearby and
                            the medicines will not have to practice waiting patiently.
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
                              After payment, send the receipt to the pharmacy email for
                              faster processing.
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
                    <span>Comment for pharmacy</span>
                    <textarea
                      value={comment}
                      maxLength={240}
                      onChange={(event) => setComment(event.target.value)}
                    />
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
