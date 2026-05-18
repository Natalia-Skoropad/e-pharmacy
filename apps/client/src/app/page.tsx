import Image from 'next/image';

import { ButtonLink, Container, SvgIcon } from '@/components/common';

import { HOME_DESCRIPTION, HOME_TITLE } from '@/lib/constants/metadata';
import { ROUTES } from '@/lib/constants/routes';
import { createPageMetadata } from '@/lib/seo';

import css from './page.module.css';

//===================================================================

export const metadata = createPageMetadata({
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  path: '/',
});

//===================================================================

const STATS = [
  { value: '126+', label: 'medicines in catalog' },
  { value: '98+', label: 'trusted pharmacy stores' },
  { value: '24/7', label: 'online order access' },
] as const;

const BENEFITS = [
  'Compare prices and availability across nearby pharmacies.',
  'Save favorite medicines and stores in your personal account.',
  'Review every pharmacy invoice separately before checkout.',
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

const FEATURE_CARDS = [
  {
    title: 'Smart catalog',
    text: 'Fast medicine search, category filters, availability filters, and sorting for everyday health essentials.',
  },
  {
    title: 'Pharmacy profiles',
    text: 'Store contacts, working hours, reviews, payment details, and products are collected on clear pages.',
  },
  {
    title: 'Personal cabinet',
    text: 'Profile details, avatar, delivery information, favorites, and order history stay close at hand.',
  },
  {
    title: 'Separated invoices',
    text: 'Cart items are grouped by pharmacy, so every order block has its own total and checkout flow.',
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
] as const;

//===================================================================

function HomePage() {
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
                  <SvgIcon name="icon-map-pin" size={18} />
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
              Find a trusted pharmacy near you
            </h2>
            <p className={css.sectionText}>
              Browse pharmacy stores, check ratings, contacts, addresses,
              working hours, and open the exact store page before ordering.
            </p>
          </div>

          <div className={css.storePreviewGrid}>
            {['Wellness Hub', 'Green Care', 'Health Point'].map(
              (name, index) => (
                <article className={css.storeCard} key={name}>
                  <div>
                    <h3>{name}</h3>
                    <p>{['Kyiv', 'Lviv', 'Odesa'][index]}</p>
                  </div>
                  <span className={css.rating}>
                    <SvgIcon name="icon-star" size={16} /> {5 - index}
                  </span>
                  <span className={css.status}>Open</span>
                </article>
              )
            )}
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
              {BENEFITS.map((benefit) => (
                <li key={benefit}>
                  <SvgIcon name="icon-lightning" size={18} />
                  {benefit}
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

          <div className={css.featuresGrid}>
            {FEATURE_CARDS.map((feature) => (
              <article className={css.featureCard} key={feature.title}>
                <span aria-hidden="true">
                  <SvgIcon name="icon-lightning" size={18} />
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
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

          <div className={css.reviewsGrid}>
            {REVIEWS.map((review) => (
              <article className={css.reviewCard} key={review.name}>
                <div className={css.avatar} aria-hidden="true">
                  {review.name.charAt(0)}
                </div>
                <h3>{review.name}</h3>
                <p>{review.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </main>
  );
}

export default HomePage;
