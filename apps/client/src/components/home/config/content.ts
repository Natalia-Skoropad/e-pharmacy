import {
  Building2,
  ClipboardList,
  Heart,
  MapPin,
  PackageSearch,
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

export const HOME_FEATURES = [
  {
    id: 'catalog',
    title: 'Smart catalog',
    text: 'Find products, use category and availability filters, and compare pharmacy offers.',
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
    text: 'Keep profile details, delivery information, favorites, and order-request history together.',
    href: ROUTES.PROFILE,
    actionLabel: 'Open profile',
    icon: ClipboardList,
  },
  {
    id: 'cart',
    title: 'Order requests by pharmacy',
    text: 'Cart items are grouped by pharmacy, so each request has its own total and confirmation flow.',
    href: ROUTES.CART,
    actionLabel: 'Open cart',
    icon: ShoppingCart,
  },
] as const satisfies readonly HomeFeature[];

//===================================================================

export const BENEFITS = [
  {
    id: 'compare',
    title: 'Compare before you request',
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
    title: 'Control every request',
    text: 'Cart items are grouped by pharmacy, with a clear total and confirmation flow for each request.',
    icon: ReceiptText,
  },
  {
    id: 'fulfillment',
    title: 'Request pickup or delivery',
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
    title: 'Prepare an order request',
    text: 'Choose pickup or request delivery, add contact details, and send the request to the pharmacy.',
  },
] as const satisfies readonly HomeStep[];
