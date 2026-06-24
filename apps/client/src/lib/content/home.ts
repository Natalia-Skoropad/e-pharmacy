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

export const STATS = [
  { value: '126+', label: 'products in catalog' },
  { value: '98+', label: 'trusted pharmacies' },
  { value: '24/7', label: 'online order access' },
] as const;

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

export const REVIEWS = [
  {
    name: 'Maria Tkachenko',
    rating: 5,
    text: 'The catalog feels simple and reliable. I found the product by name, checked which pharmacies had it available, compared ratings, and opened the pharmacy page before ordering. It is helpful that every pharmacy has its own details, contacts, and product list, because I can make a decision without jumping between different tabs.',
  },
  {
    name: 'Sergey Rybachok',
    rating: 4.8,
    text: 'Separate pharmacy orders make the cart much easier to understand. I can see which items belong to which pharmacy, review every total separately, and move to checkout without guessing where the final sum came from. The flow feels clear even when I add products from several pharmacies at once.',
  },
  {
    name: 'Natalia Chatuk',
    rating: 4.6,
    text: 'Favorite pharmacies and order history are exactly what I need when buying the same products again. I do not have to search from the beginning every time. The profile keeps useful information close, and the pharmacy cards show enough details to choose a familiar pharmacy quickly.',
  },
  {
    name: 'Olena Voronina',
    rating: 4.9,
    text: 'I liked that I could compare pharmacy offers before adding anything to the cart. The product page shows prices, ratings, and availability, so the purchase feels calm and predictable. It is especially useful when the same product is available in several pharmacies with different prices.',
  },
  {
    name: 'Andriy Melnyk',
    rating: 4.4,
    text: 'The profile page saves time because repeat orders, delivery details, and favorite pharmacies are not hiding somewhere in a digital jungle. I can return to the information I need, update personal details, and check previous orders without feeling lost in the interface.',
  },
  {
    name: 'Iryna Sokolova',
    rating: 4.7,
    text: 'The checkout is clear: pickup details, delivery fields, pharmacy totals, and order comments are shown exactly where I expect them. I also like that each pharmacy order is handled separately, because it makes confirmation more transparent and easier to review before submitting.',
  },
] as const;
