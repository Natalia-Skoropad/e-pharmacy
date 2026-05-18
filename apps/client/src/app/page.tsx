import Image from 'next/image';
import { Heart, MapPin, ReceiptText, SearchCheck, ShieldCheck } from 'lucide-react';

import { ButtonLink, Container, SvgIcon } from '@/components/common';
import { HomeFeatureCards, HomeReviewsSlider } from '@/components/home';

import { HOME_DESCRIPTION, HOME_TITLE } from '@/lib/constants/metadata';
import { ROUTES } from '@/lib/constants/routes';
import { buildStorePath } from '@/lib/routes';
import { createPageMetadata } from '@/lib/seo';
import { getStores } from '@/services/store-service';

import type { Store } from '@/types';

import css from './page.module.css';

//===================================================================

export const dynamic = 'force-dynamic';

export const metadata = createPageMetadata({
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  path: '/',
});

//===================================================================

const HOME_STORES_LIMIT = 6;

const STATS = [
  { value: '126+', label: 'medicines in catalog' },
  { value: '98+', label: 'trusted pharmacy stores' },
  { value: '24/7', label: 'online order access' },
] as const;

const BENEFITS = [
  {
    text: 'Compare prices and availability across nearby pharmacies.',
    icon: SearchCheck,
  },
  {
    text: 'Save favorite medicines and stores in your personal account.',
    icon: Heart,
  },
  {
    text: 'Review every pharmacy invoice separately before checkout.',
    icon: ReceiptText,
  },
  {
    text: 'Choose pickup or post delivery for each confirmed order.',
    icon: MapPin,
  },
  {
    text: 'Keep profile details, delivery address, and order history together.',
    icon: ShieldCheck,
  },
] as const;

const STEPS = [
  {
    title: 'Find medicines',
    text: 'Search by name or article, filter by category, and open detailed product information.',
  },
  {
    title: 'Choose pharmacy',
    text: 'Check prices, ratings, available quantity, and store details before adding items to cart.',
  },
  {
    title: 'Confirm order',
    text: 'Select pickup or post delivery, add contact details, and keep the order in your profile.',
  },
] as const;

const REVIEWS = [
  {
    name: 'Maria Tkachenko',
    text: 'The catalog feels simple: I found my medicine, checked the pharmacy rating, and finished checkout quickly.',
  },
  {
    name: 'Sergey Rybachok',
    text: 'Separate pharmacy invoices make the cart much easier to understand. No math gymnastics, finally.',
  },
  {
    name: 'Natalia Chatuk',
    text: 'Favorite stores and order history are exactly what I need when buying the same medicines again.',
  },
  {
    name: 'Olena Voronina',
    text: 'I liked that I could compare pharmacy offers before adding anything to the cart. It feels calm and predictable.',
  },
  {
    name: 'Andriy Melnyk',
    text: 'The profile page saves time because repeat orders and favorite pharmacies are not hiding in a digital jungle.',
  },
  {
    name: 'Iryna Sokolova',
    text: 'The checkout is clear: pickup details, delivery fields, and pharmacy totals are shown exactly where I expect them.',
  },
  {
    name: 'Dmytro Kovalenko',
    text: 'I use the pharmacy pages to check contacts, hours, ratings, and payment details before placing an order.',
  },
  {
    name: 'Kateryna Bondar',
    text: 'Search by medicine article is a small thing, but it makes buying the right item much safer and faster.',
  },
  {
    name: 'Viktor Shevchenko',
    text: 'The cart grouping by pharmacy is great. Each invoice has its own total, so nothing turns into spreadsheet soup.',
  },
] as const;

//===================================================================

function shuffleStores(stores: Store[]): Store[] {
  return [...stores].sort(() => Math.random() - 0.5);
}

async function getRandomStores(): Promise<Store[]> {
  try {
    const response = await getStores({ page: 1, perPage: 98 });

    return shuffleStores(response.items).slice(0, HOME_STORES_LIMIT);
  } catch {
    return [];
  }
}

//===================================================================

async function HomePage() {
  const randomStores = await getRandomStores();

  return (
    <main className={css.page}>
      <section className={css.hero} aria-labelledby="home-title">
        <Container>
          <div className={css.heroGrid}>
            <div className={css.heroContent}>
              <p className={css.kicker}>Online pharmacy platform</p>

              <h1 className={css.heroTitle} id="home-title">
                Your medication delivered with care
              </h1>

              <p className={css.heroText}>
                Order medicines online, compare pharmacy offers, manage your
                cart by store, and keep health essentials organized in one calm
                digital place.
              </p>

              <div className={css.actions}>
                <ButtonLink href={ROUTES.MEDICINES_CATALOG} size="lg">
                  Buy medicine
                </ButtonLink>

                <ButtonLink href={ROUTES.STORES} variant="secondary" size="lg">
                  View pharmacies
                </ButtonLink>
              </div>
            </div>

            <div className={css.heroMedia} aria-hidden="true">
              <Image
                src="/images/home/three-pills.png"
                alt=""
                fill
                priority
                sizes="(min-width: 1440px) 560px, (min-width: 768px) 48vw, 100vw"
                className={css.heroImage}
              />
            </div>
          </div>
        </Container>
      </section>

      <section className={css.statsSection} aria-label="E-PHARMACY highlights">
        <Container>
          <ul className={css.statsList}>
            {STATS.map((stat, index) => (
              <li className={css.statCard} key={stat.label}>
                <span className={css.statNumber}>{index + 1}</span>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className={css.section} aria-labelledby="stores-title">
        <Container>
          <div className={css.sectionHead}>
            <p className={css.kicker}>Medicine stores</p>
            <h2 className={css.sectionTitle} id="stores-title">
              Discover random trusted pharmacies today
            </h2>
            <p className={css.sectionText}>
              Every visit shows a fresh mix of pharmacy cards, so customers can
              explore new stores, compare ratings, and open the right pharmacy
              page before ordering.
            </p>
          </div>

          {randomStores.length > 0 ? (
            <div className={css.storePreviewGrid}>
              {randomStores.map((store) => (
                <article className={css.storeCard} key={store.id}>
                  <div>
                    <h3>{store.name}</h3>
                    <p>{store.city ?? store.address}</p>
                  </div>
                  <span className={css.rating}>
                    <SvgIcon name="icon-star" size={16} />{' '}
                    {(store.rating ?? 0).toFixed(1)}
                  </span>
                  <span className={css.status}>
                    {store.isActive ? 'Open' : 'Closed'}
                  </span>
                  <ButtonLink
                    className={css.storeLink}
                    href={buildStorePath(store.name, store.id)}
                    variant="secondary"
                    size="sm"
                  >
                    View pharmacy
                  </ButtonLink>
                </article>
              ))}
            </div>
          ) : null}

          <div className={css.sectionAction}>
            <ButtonLink href={ROUTES.STORES} variant="secondary">
              View all pharmacies
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section className={css.section} aria-labelledby="steps-title">
        <Container>
          <div className={css.splitGrid}>
            <div>
              <p className={css.kicker}>How it works</p>
              <h2 className={css.sectionTitle} id="steps-title">
                From search to checkout in three simple steps
              </h2>
            </div>

            <ol className={css.stepsList}>
              {STEPS.map((step, index) => (
                <li className={css.stepCard} key={step.title}>
                  <span>{index + 1}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      <section className={css.bannerSection} aria-labelledby="banner-title">
        <Container>
          <div className={css.banner}>
            <div className={css.bannerContent}>
              <p className={css.kicker}>Quick online orders</p>
              <h2 className={css.bannerTitle} id="banner-title">
                Add the medicines you need online now
              </h2>
              <p>
                Build your cart by pharmacy, control available quantities, and
                prepare pickup or post delivery without the usual pharmacy-queue
                side quest.
              </p>
              <ButtonLink href={ROUTES.MEDICINES_CATALOG} variant="secondary">
                Browse catalog
              </ButtonLink>
            </div>

            <div className={css.bannerMedia}>
              <Image
                src="/images/home/girl-holding-pills-in-her-hands.png"
                alt="Customer holding medicine and using a phone"
                fill
                sizes="(min-width: 1440px) 520px, (min-width: 768px) 46vw, 100vw"
                className={css.bannerImage}
              />
            </div>
          </div>
        </Container>
      </section>

      <section className={css.section} aria-labelledby="benefits-title">
        <Container>
          <div className={css.benefitsGrid}>
            <div>
              <p className={css.kicker}>Why customers use it</p>
              <h2 className={css.sectionTitle} id="benefits-title">
                Everything important stays organized
              </h2>
            </div>

            <ul className={css.benefitsList}>
              {BENEFITS.map(({ text, icon: Icon }) => (
                <li key={text}>
                  <span className={css.benefitIcon} aria-hidden="true">
                    <Icon size={18} />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <section className={css.section} aria-labelledby="features-title">
        <Container>
          <div className={css.sectionHead}>
            <p className={css.kicker}>Platform features</p>
            <h2 className={css.sectionTitle} id="features-title">
              Built for catalog, cart, profile, and orders
            </h2>
          </div>

          <HomeFeatureCards />
        </Container>
      </section>

      <section className={css.section} aria-labelledby="reviews-title">
        <Container>
          <div className={css.sectionHead}>
            <p className={css.kicker}>Customer reviews</p>
            <h2 className={css.sectionTitle} id="reviews-title">
              A calmer way to manage medicines
            </h2>
          </div>

          <HomeReviewsSlider reviews={REVIEWS} />
        </Container>
      </section>
    </main>
  );
}

export default HomePage;
