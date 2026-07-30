import {
  Heart,
  MapPin,
  ReceiptText,
  SearchCheck,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

//===================================================================

export const HOME_PREVIEW_LIMIT = 6;

//===================================================================


//===================================================================

type HomeBenefit = {
  title: string;
  text: string;
  icon: LucideIcon;
};

//===================================================================

export const BENEFITS = [
  {
    title: 'Compare before you order',
    text: 'Check prices, ratings, pharmacy contacts, and available products before choosing a pharmacy.',
    icon: SearchCheck,
  },
  {
    title: 'Keep favorites nearby',
    text: 'Save products and pharmacies in your account so repeat purchases take less time.',
    icon: Heart,
  },
  {
    title: 'Control every order',
    text: 'Cart items are grouped by pharmacy, with a clear total and checkout flow for each order block.',
    icon: ReceiptText,
  },
  {
    title: 'Choose convenient delivery',
    text: 'Pick up an order from the pharmacy or add postal delivery details during confirmation.',
    icon: MapPin,
  },
  {
    title: 'Return to order history',
    text: 'Profile details, delivery address, favorite items, and confirmed orders stay connected.',
    icon: ShieldCheck,
  },
] as const satisfies readonly HomeBenefit[];

//===================================================================

export const STEPS = [
  {
    title: 'Find products',
    text: 'Search by name or article, filter by category, and open detailed product information.',
  },
  {
    title: 'Choose pharmacy',
    text: 'Check prices, ratings, available quantity, and pharmacy details before adding items to cart.',
  },
  {
    title: 'Confirm order',
    text: 'Select pickup or postal delivery, add contact details, and keep the order in your profile.',
  },
] as const;

//===================================================================

