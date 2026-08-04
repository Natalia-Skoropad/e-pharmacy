import {
  Building2,
  ClipboardList,
  Clock3,
  Heart,
  MapPin,
  PackageSearch,
  Pill,
  ReceiptText,
  SearchCheck,
  ShieldCheck,
  ShoppingCart,
  type LucideIcon,
} from 'lucide-react';

import { ROUTES } from '@/lib/routes';

//===================================================================

type HomeFeature = Readonly<{
  id: string;
  title: string;
  text: string;
  href: string;
  actionLabel: string;
  icon: LucideIcon;
}>;

type HomeBenefit = Readonly<{
  id: string;
  title: string;
  text: string;
  icon: LucideIcon;
}>;

type HomeStep = Readonly<{
  id: string;
  title: string;
  text: string;
}>;

//===================================================================

export type HomeReview = Readonly<{
  id: string;
  author: string;
  rating: number;
  comment: string;
}>;

//===================================================================

export const HOME_STATS = [
  {
    id: 'catalog-size',
    value: '126+',
    label: 'products in catalog',
    icon: Pill,
  },
  {
    id: 'pharmacy-network',
    value: '98+',
    label: 'partner pharmacy stores',
    icon: Building2,
  },
  {
    id: 'online-access',
    value: '24/7',
    label: 'online catalog access',
    icon: Clock3,
  },
] as const;

//===================================================================

export const HOME_FEATURES = [
  {
    id: 'catalog',
    title: 'Smart catalog',
    text: 'Find products, use category and availability filters, compare pharmacy offers, and check prices and stock before choosing a pharmacy.',
    href: ROUTES.PRODUCTS_CATALOG,
    actionLabel: 'Open catalog',
    icon: PackageSearch,
  },
  {
    id: 'pharmacies',
    title: 'Pharmacy profiles',
    text: 'Review pharmacy contacts, working hours, ratings, payment information, and available products.',
    href: ROUTES.PHARMACIES,
    actionLabel: 'View pharmacies',
    icon: Building2,
  },
  {
    id: 'profile',
    title: 'Personal cabinet',
    text: 'Keep profile details, delivery information, favorites, and order history together.',
    href: ROUTES.PROFILE,
    actionLabel: 'Open profile',
    icon: ClipboardList,
  },
  {
    id: 'cart',
    title: 'Orders by pharmacy',
    text: 'Cart items are grouped by pharmacy, so each order has its own total and confirmation flow.',
    href: ROUTES.CART,
    actionLabel: 'Open cart',
    icon: ShoppingCart,
  },
] as const satisfies readonly HomeFeature[];

//===================================================================

export const BENEFITS = [
  {
    id: 'compare',
    title: 'Compare before ordering',
    text: 'Check prices, ratings, pharmacy contacts, and available products before choosing a pharmacy.',
    icon: SearchCheck,
  },
  {
    id: 'favorites',
    title: 'Keep favorites nearby',
    text: 'Save products and pharmacies in your account so future searches take less time.',
    icon: Heart,
  },
  {
    id: 'order-control',
    title: 'Control every order',
    text: 'Cart items are grouped by pharmacy, with a clear total and confirmation flow for each order.',
    icon: ReceiptText,
  },
  {
    id: 'fulfillment',
    title: 'Choose pickup or delivery',
    text: 'Choose pharmacy pickup or provide postal delivery details for pharmacy and carrier confirmation.',
    icon: MapPin,
  },
  {
    id: 'history',
    title: 'Return to order history',
    text: 'Profile details, delivery address, favorite items, and confirmed pharmacy orders stay connected.',
    icon: ShieldCheck,
  },
] as const satisfies readonly HomeBenefit[];

//===================================================================

export const STEPS = [
  {
    id: 'find-products',
    title: 'Find products',
    text: 'Search by name or article, filter by category, and review detailed product information.',
  },
  {
    id: 'choose-pharmacy',
    title: 'Choose a pharmacy',
    text: 'Compare prices, ratings, confirmed availability, and pharmacy details before adding an offer.',
  },
  {
    id: 'prepare-request',
    title: 'Prepare an order',
    text: 'Choose pickup or delivery, add contact details, and place the order with the pharmacy.',
  },
] as const satisfies readonly HomeStep[];

//===================================================================

export const HOME_REVIEWS = [
  {
    id: 'natalia-catalog-review',
    author: 'Natalia',
    rating: 5,
    comment:
      'The order was processed quickly, the product page had clear details, and the pharmacy staff explained the pickup process very politely. I liked that the availability information matched the real stock, so there were no surprises when I arrived.',
  },
  {
    id: 'olena-comparison-review',
    author: 'Olena',
    rating: 5,
    comment:
      'I checked several options and this one was the easiest to understand because the description, price, rating, and pharmacy information were all in one place. The product was prepared on time and the checkout flow felt simple.',
  },
  {
    id: 'iryna-pharmacy-review',
    author: 'Iryna',
    rating: 5,
    comment:
      'The catalog helped me compare products, and the pharmacy page showed the address, phone number, rating, and available offers clearly. I could choose a pharmacy calmly without jumping between different tabs.',
  },
  {
    id: 'kateryna-pickup-review',
    author: 'Kateryna',
    rating: 5,
    comment:
      'I found the product I needed, compared the pharmacy offers, and selected a convenient pickup point in a few minutes. The order details were clear, and the pharmacy confirmed everything without unnecessary calls.',
  },
  {
    id: 'maksym-favorites-review',
    author: 'Maksym',
    rating: 4.8,
    comment:
      'Favorites make repeat searches much easier. I saved the products and pharmacies I use most often, then returned later and prepared a new order without searching through the catalog again.',
  },
  {
    id: 'sofiia-delivery-review',
    author: 'Sofiia',
    rating: 5,
    comment:
      'The delivery information was easy to understand, and I could see which pharmacy would process the order before submitting it. The status updates helped me know what was happening at every step.',
  },
  {
    id: 'andrii-mobile-review',
    author: 'Andrii',
    rating: 4.9,
    comment:
      'The mobile version is convenient and straightforward. Product information, pharmacy contacts, and the cart were easy to use, even when I needed to prepare an order while away from home.',
  },
] as const satisfies readonly HomeReview[];
