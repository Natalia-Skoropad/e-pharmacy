import Image from 'next/image';
import {
  Heart,
  MapPin,
  ReceiptText,
  SearchCheck,
  ShieldCheck,
} from 'lucide-react';

import { ButtonLink, Container } from '@/components/common';
import { HomeFeatureCards, HomeReviewsSlider } from '@/components/home';
import { ProductCard } from '@/components/medicines-catalog';
import { StoreCard } from '@/components/pharmacy-stores';

import { HOME_DESCRIPTION, HOME_TITLE } from '@/lib/constants/metadata';
import { ROUTES } from '@/lib/constants/routes';
import { createPageMetadata } from '@/lib/seo';
import { getProducts, getStores } from '@/services';

import type { Product, Store } from '@/types';

import css from './page.module.css';

//===================================================================

export const revalidate = 300;

export const metadata = createPageMetadata({
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  path: '/',
});

//===================================================================

const HOME_PREVIEW_LIMIT = 6;

const STATS = [
  { value: '126+', label: 'medicines in catalog' },
  { value: '98+', label: 'trusted pharmacy stores' },
  { value: '24/7', label: 'online order access' },
] as const;

const BENEFITS = [
  {
    title: 'Compare before you order',
    text: 'Check prices, ratings, store contacts, and available products before choosing a pharmacy.',
    icon: SearchCheck,
  },
  {
    title: 'Keep favorites nearby',
    text: 'Save medicines and pharmacy stores in your account so repeat purchases take less time.',
    icon: Heart,
  },
  {
    title: 'Control every invoice',
    text: 'Cart items are grouped by pharmacy, with a clear total and checkout flow for each order block.',
    icon: ReceiptText,
  },
  {
    title: 'Choose convenient delivery',
    text: 'Pick up an order from the pharmacy or add post delivery details during confirmation.',
    icon: MapPin,
  },
  {
    title: 'Return to order history',
    text: 'Profile details, delivery address, favorite items, and confirmed orders stay connected.',
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
    text: 'Separate pharmacy invoices make the cart much easier to understand. I can see which items belong to which pharmacy, review every total separately, and move to checkout without guessing where the final sum came from. The flow feels clear even when I add products from several stores at once.',
  },
  {
    name: 'Natalia Chatuk',
    rating: 4.6,
    text: 'Favorite stores and order history are exactly what I need when buying the same medicines again. I do not have to search from the beginning every time. The profile keeps useful information close, and the pharmacy cards show enough details to choose a familiar store quickly.',
  },
  {
    name: 'Olena Voronina',
    rating: 4.9,
    text: 'I liked that I could compare pharmacy offers before adding anything to the cart. The product page shows prices, ratings, and availability, so the purchase feels calm and predictable. It is especially useful when the same medicine is available in several pharmacies with different prices.',
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
  {
    name: 'Dmytro Kovalenko',
    rating: 4.5,
    text: 'I use pharmacy pages to check contacts, working hours, ratings, available products, and payment details before placing an order. The store card gives a quick overview, and the detail page has enough information to understand whether the pharmacy is the right choice for my order.',
  },
  {
    name: 'Kateryna Bondar',
    rating: 4.2,
    text: 'Search by medicine article is a small feature, but it makes buying the correct item much safer and faster. When a medicine has a similar name or package, the article helps me avoid mistakes. The category filters and product cards also make the catalog easier to scan.',
  },
  {
    name: 'Viktor Shevchenko',
    rating: 4.8,
    text: 'The cart grouping by pharmacy is great. Each invoice has its own products, total, and checkout action, so the page never turns into a messy spreadsheet. I can continue shopping inside one pharmacy, add missing items, and still keep the order structure clean.',
  },
] as const;

//===================================================================

async function getFeaturedStores(): Promise<Store[]> {
  try {
    const response = await getStores({
      page: 1,
      perPage: HOME_PREVIEW_LIMIT,
      sort: 'rating-desc',
    });

    return response.items;
  } catch {
    return [];
  }
}

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const response = await getProducts({
      page: 1,
      perPage: HOME_PREVIEW_LIMIT,
      sort: 'rating-desc',
    });

    return response.items;
  } catch {
    return [];
  }
}

//===================================================================

async function HomePage() {
  const [featuredStores, featuredProducts] = await Promise.all([
    getFeaturedStores(),
    getFeaturedProducts(),
  ]);

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
              Find a trusted pharmacy for your order
            </h2>
            <p className={css.sectionText}>
              Explore pharmacy stores, compare ratings, check contacts and
              available medicines, then open the store that feels right before
              placing an order.
            </p>
          </div>

          {featuredStores.length > 0 ? (
            <div className={css.previewGrid}>
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
      <section className={css.section} aria-labelledby="products-title">
        <Container>
          <div className={css.sectionHead}>
            <p className={css.kicker}>Medicine catalog</p>
            <h2 className={css.sectionTitle} id="products-title">
              Browse medicines available in pharmacies
            </h2>
            <p className={css.sectionText}>
              Open product cards, compare prices in pharmacies, check ratings,
              and add the right medicine to your cart from the catalog.
            </p>
          </div>

          {featuredProducts.length > 0 ? (
            <div className={css.previewGrid}>
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  skipFavoriteRefresh
                />
              ))}
            </div>
          ) : null}

          <div className={css.sectionAction}>
            <ButtonLink href={ROUTES.MEDICINES_CATALOG} variant="secondary">
              View all medicines
            </ButtonLink>
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
