'use client';

import { useRouter } from 'next/navigation';

import {
  Building2,
  ClipboardList,
  PackageSearch,
  ShoppingCart,
  type LucideIcon,
} from 'lucide-react';

import { Button, ButtonLink } from '@e-pharmacy/ui/common';
import { useToast } from '@e-pharmacy/ui/feedback';

import { ROUTES } from '@/lib/routes';
import { useClientAuthCapabilities } from '@/hooks';

import css from './HomeFeatureCards.module.css';

//===================================================================

type FeatureCard = {
  title: string;
  text: string;
  href: string;
  buttonLabel: string;
  isProtected?: boolean;
  icon: LucideIcon;
};

const FEATURE_CARDS: FeatureCard[] = [
  {
    title: 'Smart catalog',
    text: 'Fast product search, category filters, availability filters, and sorting for everyday health essentials.',
    href: ROUTES.PRODUCTS_CATALOG,
    buttonLabel: 'Open catalog',
    icon: PackageSearch,
  },
  {
    title: 'Pharmacy profiles',
    text: 'Pharmacy contacts, working hours, reviews, payment details, and products are collected on clear pages.',
    href: ROUTES.PHARMACIES,
    buttonLabel: 'View pharmacies',
    icon: Building2,
  },
  {
    title: 'Personal cabinet',
    text: 'Profile details, photo, delivery information, favorites, and order history stay close at hand.',
    href: ROUTES.PROFILE,
    buttonLabel: 'Open profile',
    isProtected: true,
    icon: ClipboardList,
  },
  {
    title: 'Separated orders',
    text: 'Cart items are grouped by pharmacy, so every order block has its own total and checkout flow.',
    href: ROUTES.CART,
    buttonLabel: 'Open cart',
    isProtected: true,
    icon: ShoppingCart,
  },
];

//===================================================================

function HomeFeatureCards() {
  const router = useRouter();
  const { isAuthenticated, isAuthReady, canUseClientFeatures, isPharmacy } =
    useClientAuthCapabilities();
  const toast = useToast();

  const handleProtectedClick = (href: string) => {
    if (!isAuthReady || !isAuthenticated) {
      toast.error('Please log in to open this private page.');
      return;
    }

    if (!canUseClientFeatures) {
      toast.info(
        isPharmacy
          ? 'Cart and personal client pages are available only for client accounts.'
          : 'This page is available only for client accounts.'
      );
      return;
    }

    router.push(href);
  };

  return (
    <div className={css.featuresGrid}>
      {FEATURE_CARDS.map(({ icon: Icon, ...feature }) => (
        <article className={css.featureCard} key={feature.title}>
          <span className={css.iconWrap} aria-hidden="true">
            <Icon size={26} />
          </span>
          <h3>{feature.title}</h3>
          <p>{feature.text}</p>

          {feature.isProtected ? (
            <Button
              className={css.featureAction}
              type="button"
              variant="secondary"
              onClick={() => handleProtectedClick(feature.href)}
            >
              {feature.buttonLabel}
            </Button>
          ) : (
            <ButtonLink
              className={css.featureAction}
              href={feature.href}
              variant="secondary"
            >
              {feature.buttonLabel}
            </ButtonLink>
          )}
        </article>
      ))}
    </div>
  );
}

export default HomeFeatureCards;
