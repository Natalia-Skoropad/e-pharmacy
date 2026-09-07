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
  eyebrow: string;
  title: string;
  text: string;
  highlights: readonly [string, string, string];
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
    id: 'catalog-search',
    value: 'Search',
    label: 'products by name or article',
    icon: Pill,
  },
  {
    id: 'pharmacy-comparison',
    value: 'Compare',
    label: 'pharmacy offers and details',
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
    eyebrow: 'Discover',
    title: 'Smart catalog',
    text: 'Move from a broad search to a suitable product and pharmacy offer without losing the important details.',
    highlights: [
      'Search by product name or article',
      'Filter by category and availability',
      'Compare prices, ratings, and stock',
    ],
    href: ROUTES.PRODUCTS_CATALOG,
    actionLabel: 'Open catalog',
    icon: PackageSearch,
  },
  {
    id: 'pharmacies',
    eyebrow: 'Compare',
    title: 'Pharmacy profiles',
    text: 'Check the pharmacy behind an offer before deciding where your order should be prepared.',
    highlights: [
      'See contacts and working hours',
      'Review ratings and client feedback',
      'Open products available right now',
    ],
    href: ROUTES.PHARMACIES,
    actionLabel: 'View pharmacies',
    icon: Building2,
  },
  {
    id: 'profile',
    eyebrow: 'Personalize',
    title: 'Personal cabinet',
    text: 'Keep the information you use most often in one secure and convenient personal space.',
    highlights: [
      'Manage profile and delivery details',
      'Return to favorite products and pharmacies',
      'Follow current and previous orders',
    ],
    href: ROUTES.PROFILE,
    actionLabel: 'Open profile',
    icon: ClipboardList,
  },
  {
    id: 'cart',
    eyebrow: 'Order',
    title: 'Orders by pharmacy',
    text: 'Prepare clear pharmacy-specific orders with transparent quantities, totals, and fulfillment details.',
    highlights: [
      'Keep products grouped by pharmacy',
      'Review quantities and order totals',
      'Choose pickup or postal delivery',
    ],
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
      'I found the medicine I needed, compared pharmacy offers, and chose a convenient pickup point without opening extra tabs. Prices, ratings, availability, and order details were easy to understand. It felt clear and easy.',
  },
  {
    id: 'olena-comparison-review',
    author: 'Olena',
    rating: 5,
    comment:
      'The catalog is easy to navigate, and the filters helped me narrow the list quickly. I liked seeing pharmacy information next to each offer because comparing price, location, and stock was much faster. It saved me time.',
  },
  {
    id: 'iryna-favorites-review',
    author: 'Iryna',
    rating: 5,
    comment:
      'I saved the products and pharmacies I use most often, then came back later and found them again quickly. Favorites keep things organized and make it easy to return to saved items and pharmacies. It felt clear and easy.',
  },
  {
    id: 'kateryna-pharmacy-review',
    author: 'Kateryna',
    rating: 5,
    comment:
      'The pharmacy page showed the address, contacts, rating, working hours, and available products in one view. I could check everything before ordering and choose the right location without extra calls. It worked smoothly.',
  },
  {
    id: 'maksym-checkout-review',
    author: 'Maksym',
    rating: 4.8,
    comment:
      'Checkout felt straightforward from start to finish. The cart grouped products by pharmacy, quantities were easy to review, and the delivery and payment information was clear before I submitted the order. It felt right.',
  },
  {
    id: 'sofiia-mobile-review',
    author: 'Sofiia',
    rating: 5,
    comment:
      'I mostly use the service from my phone, and the mobile version is comfortable to work with. Product cards are readable, the cart is easy to manage, and saved pharmacies are quick to open again. I found that convenient.',
  },
  {
    id: 'andrii-order-review',
    author: 'Andrii',
    rating: 4.9,
    comment:
      'Order preparation was calmer than I expected. I could see what was available, compare several options, check the selected pharmacy, and review the final details before sending the order for confirmation. It was simple.',
  },
] as const satisfies readonly HomeReview[];
