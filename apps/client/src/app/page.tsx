import Image from 'next/image';
import { Heart, MapPin, ReceiptText, SearchCheck, ShieldCheck } from 'lucide-react';

import { ButtonLink, Container } from '@/components/common';
import { HomeFeatureCards, HomeReviewsSlider } from '@/components/home';
import { StoreCard } from '@/components/pharmacy-stores';

import { HOME_DESCRIPTION, HOME_TITLE } from '@/lib/constants/metadata';
import { ROUTES } from '@/lib/constants/routes';
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

const HOME_STORES_LIMIT = 3;

const STATS = [
  { value: '126+', label: 'medicines in catalog' },
  { value: '98+', label: 'trusted pharmacy stores' },
  { value: '24/7', label: 'online order access' },
] as const;

const BENEFITS = [
  {
    title: 'Compare offers',
    text: 'Check prices, ratings, and product availability before choosing a pharmacy.',
    icon: SearchCheck,
  },
  {
    title: 'Save essentials',
    text: 'Keep favorite medicines and trusted stores close in your personal account.',
    icon: Heart,
  },
  {
    title: 'Control every invoice',
    text: 'Review pharmacy totals separately, so each order block stays clear.',
    icon: ReceiptText,
  },
  {
    title: 'Choose delivery type',
    text: 'Switch between pickup and post delivery with the right details shown instantly.',
    icon: MapPin,
  },
  {
    title: 'Keep history together',
    text: 'Profile details, delivery address, favorites, and orders stay in one organized place.',
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
    rating: 5,
    text: 'The catalog feels simple and reliable. I found the medicine by name, checked which pharmacies had it available, compared ratings, and opened the store page before ordering. It is helpful that every pharmacy has its own details, contacts, and product list, because I can make a decision without jumping between different tabs.',
  },
  {
    name: 'Sergey Rybachok',
    rating: 4.8,
    text: 'Separate pharmacy invoices made the cart much easier to understand. When medicines come from different stores, each block has its own total, available quantity, and checkout flow. I always know what I am ordering from each pharmacy and do not have to recalculate the final price manually.',
  },
  {
    name: 'Natalia Chatuk',
    rating: 4.6,
    text: 'Favorite stores and order history are exactly what I need when buying the same medicines again. I can return to pharmacies I already trust, check previous orders, update profile information, and keep delivery details ready for the next checkout. The whole flow feels organized and calm.',
  },
  {
    name: 'Olena Voronina',
    rating: 4.9,
    text: 'I liked that I could compare pharmacy offers before adding anything to the cart. The product page shows useful details, prices in pharmacies, reviews, and availability, so it is much easier to choose the right option. The interface does not feel overloaded, even when there is a lot of information.',
  },
  {
    name: 'Andriy Melnyk',
    rating: 4.4,
    text: 'The profile page saves time because repeat orders, favorite medicines, favorite pharmacies, and delivery information are kept together. I also like that pharmacy cards show ratings and review counts right away. It gives enough context to choose a store confidently before opening the full page.',
  },
  {
    name: 'Iryna Sokolova',
    rating: 4.7,
    text: 'The checkout is clear: pickup details, delivery fields, pharmacy totals, and order comments are placed where I expect them. I can see the pharmacy information before confirming and choose the delivery method that fits the order. It reduces mistakes and makes online ordering feel safer.',
  },
  {
    name: 'Dmytro Kovalenko',
    rating: 4.2,
    text: 'I use pharmacy pages to check contacts, working hours, ratings, available medicines, and payment details before placing an order. It is convenient that the store page and medicine catalog are connected, so I can move from a pharmacy to its products without losing context.',
  },
  {
    name: 'Kateryna Bondar',
    rating: 4.5,
    text: 'Search by medicine article is a small feature, but it makes buying the right item much safer and faster. When names are similar, the article helps avoid confusion. Combined with category filters and pharmacy availability, it turns a stressful search into a much clearer process.',
  },
  {
    name: 'Viktor Shevchenko',
    rating: 4.3,
    text: 'The cart grouping by pharmacy is great. Each invoice has its own total, its own products, and its own confirmation flow, so nothing gets mixed together. I can add more medicines from the selected pharmacy and still understand exactly what will be ordered from that store.',
  },
] as const;

//===================================================================

function getFeaturedStoresList(stores: Store[]): Store[] {
  return [...stores]
    .sort((firstStore, secondStore) => {
      const secondRating = secondStore.rating ?? 0;
      const firstRating = firstStore.rating ?? 0;

      if (secondRating !== firstRating) return secondRating - firstRating;

      return (secondStore.reviewsCount ?? 0) - (firstStore.reviewsCount ?? 0);
    })
    .slice(0, HOME_STORES_LIMIT);
}

async function getFeaturedStores(): Promise<Store[]> {
  try {
    const response = await getStores({ page: 1, perPage: 98 });

    return getFeaturedStoresList(response.items);
  } catch {
    return [];
  }
}

//===================================================================

async function HomePage() {
  const featuredStores = await getFeaturedStores();

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
              Find a pharmacy you can trust for today’s order
            </h2>
            <p className={css.sectionText}>
              Explore verified pharmacy pages, compare ratings and reviews,
              check available medicines, and open the store that fits your order
              best.
            </p>
          </div>

          {featuredStores.length > 0 ? (
            <div className={css.storePreviewGrid}>
              {featuredStores.map((store) => (
                <StoreCard key={store.id} store={store} skipFavoriteRefresh />
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

            <div className={css.benefitsPanel}>
              <div className={css.benefitsAccentCard}>
                <span className={css.benefitsBadge}>One account</span>
                <strong>
                  Search, compare, save, and confirm orders without losing
                  important details.
                </strong>
                <p>
                  E-PHARMACY keeps medicine search, pharmacy choice, cart
                  invoices, profile data, and order history connected in one
                  clear flow.
                </p>
              </div>

              <ul className={css.benefitsList}>
                {BENEFITS.map(({ title, text, icon: Icon }) => (
                  <li key={title}>
                    <span className={css.benefitIcon} aria-hidden="true">
                      <Icon size={22} />
                    </span>
                    <span>
                      <strong>{title}</strong>
                      <small>{text}</small>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
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

      <section className={css.reviewsSection} aria-labelledby="reviews-title">
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
