import { Suspense } from 'react';
import Image from 'next/image';

import { LinkButton } from '@e-pharmacy/ui/navigation';
import type { PublicPharmacy } from '@e-pharmacy/types/pharmacies';
import type { ProductDetails } from '@e-pharmacy/types/products';
import { Container } from '@e-pharmacy/ui/layout';

import { BENEFITS, STEPS } from '@/components/home/config/content';
import { HOME_PREVIEW_LIMIT } from '@/components/home/config/data';

import { HOME_DESCRIPTION, HOME_TITLE, createPageMetadata } from '@/lib/seo/server';
import { ROUTES } from '@/lib/routes';

import {
  getProducts,
  getPharmacies,
  PUBLIC_API_CACHE_OPTIONS,
} from '@/lib/api/server';

import HomeFeatureCards from '@/components/home/HomeFeatureCards/HomeFeatureCards';
import { ProductCard } from '@/components/product-catalog';
import { PharmacyCard } from '@/components/pharmacies';

import css from './page.module.css';

//===================================================================

export const metadata = createPageMetadata({
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  path: ROUTES.HOME,
});

//===================================================================

type FeaturedResult<T> = { items: readonly T[]; hasError: boolean };

//===================================================================

async function getFeaturedPharmacies(): Promise<
  FeaturedResult<PublicPharmacy>
> {
  try {
    const response = await getPharmacies(
      {
        page: 1,
        perPage: HOME_PREVIEW_LIMIT,
        sort: 'rating-desc',
      },
      PUBLIC_API_CACHE_OPTIONS
    );

    return { items: response.items, hasError: false };
  } catch {
    return { items: [], hasError: true };
  }
}

//===================================================================

async function getFeaturedProducts(): Promise<FeaturedResult<ProductDetails>> {
  try {
    const response = await getProducts(
      {
        page: 1,
        perPage: HOME_PREVIEW_LIMIT,
        sort: 'rating-desc',
      },
      PUBLIC_API_CACHE_OPTIONS
    );

    return { items: response.items, hasError: false };
  } catch {
    return { items: [], hasError: true };
  }
}

//===================================================================

function FeaturedSectionFallback({ label }: { label: string }) {
  return (
    <div className={css.sectionEmpty} role="status">
      Loading {label}...
    </div>
  );
}

//===================================================================

async function FeaturedPharmaciesSection() {
  const pharmaciesResult = await getFeaturedPharmacies();
  const featuredPharmacies = pharmaciesResult.items;

  return (
    <>
      {featuredPharmacies.length > 0 ? (
        <div className={css.previewGrid}>
          {featuredPharmacies.map((pharmacy) => (
            <PharmacyCard
              key={pharmacy.id}
              pharmacy={pharmacy}
            />
          ))}
        </div>
      ) : pharmaciesResult.hasError ? (
        <div className={css.sectionError}>
          Pharmacies are temporarily unavailable. Please try again shortly.
        </div>
      ) : (
        <p className={css.sectionEmpty}>No pharmacies are available yet.</p>
      )}
    </>
  );
}

//===================================================================

async function FeaturedProductsSection() {
  const productsResult = await getFeaturedProducts();
  const featuredProducts = productsResult.items;

  return (
    <>
      {featuredProducts.length > 0 ? (
        <div className={css.previewGrid}>
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      ) : productsResult.hasError ? (
        <div className={css.sectionError}>
          Products are temporarily unavailable. Please try again shortly.
        </div>
      ) : (
        <p className={css.sectionEmpty}>No products are available yet.</p>
      )}
    </>
  );
}

//===================================================================

async function HomePage() {
  return (
    <main className={css.page}>
      <section className={css.hero} aria-labelledby="home-title">
        <Container>
          <div className={css.heroGrid}>
            <div className={css.heroContent}>
              <p className={css.kicker}>Online pharmacy platform</p>

              <h1 className={css.heroTitle} id="home-title">
                Find products and prepare pharmacy order requests
              </h1>

              <p className={css.heroText}>
                Find products, compare pharmacy offers, prepare an order request,
                and choose pickup or delivery for pharmacy confirmation.
              </p>

              <div className={css.actions}>
                <LinkButton href={ROUTES.PRODUCTS_CATALOG} size="lg">
                  Find products
                </LinkButton>

                <LinkButton
                  href={ROUTES.PHARMACIES}
                  variant="secondary"
                  size="lg"
                >
                  View pharmacies
                </LinkButton>
              </div>
            </div>

            <div className={css.heroMedia} aria-hidden="true">
              <Image
                src="/images/home/three-pills.png"
                alt=""
                width={749}
                height={508}
                priority
                fetchPriority="high"
                sizes="(min-width: 1440px) 560px, (min-width: 768px) 48vw, 100vw"
                className={css.heroImage}
              />
            </div>
          </div>
        </Container>
      </section>


      <section className={css.section} aria-labelledby="pharmacies-title">
        <Container>
          <div className={css.sectionHead}>
            <p className={css.kicker}>Pharmacies</p>
            <h2 className={css.sectionTitle} id="pharmacies-title">
              Find a trusted pharmacy for your order
            </h2>
            <p className={css.sectionText}>
              Explore pharmacies, compare ratings, check contacts and available
              products, then open the pharmacy that feels right before preparing
              a request.
            </p>
          </div>

          <Suspense fallback={<FeaturedSectionFallback label="pharmacies" />}>
            <FeaturedPharmaciesSection />
          </Suspense>

          <div className={css.sectionAction}>
            <LinkButton href={ROUTES.PHARMACIES} variant="secondary">
              View all pharmacies
            </LinkButton>
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
                <li className={css.stepCard} key={step.id}>
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
              <p className={css.kicker}>Order preparation</p>
              <h2 className={css.bannerTitle} id="banner-title">
                Prepare a request for the products you need
              </h2>
              <p>
                Build your cart by pharmacy, review available quantities, and
                request pickup or postal delivery. The selected pharmacy
                confirms the final order and fulfillment details.
              </p>
              <LinkButton href={ROUTES.PRODUCTS_CATALOG} variant="secondary">
                Browse catalog
              </LinkButton>
            </div>

            <div className={css.bannerMedia}>
              <Image
                src="/images/home/girl-holding-pills-in-her-hands.png"
                alt="Client holding pills and using a phone"
                width={600}
                height={406}
                loading="lazy"
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
              <p className={css.kicker}>Why clients use it</p>
              <h2 className={css.sectionTitle} id="benefits-title">
                Everything important stays organized
              </h2>
            </div>

            <div className={css.benefitsPanel}>
              <div className={css.benefitsAccentCard}>
                <span className={css.benefitsBadge}>One account</span>
                <strong>
                  Search, compare, save, and prepare requests without losing
                  important details.
                </strong>
                <p>
                  E-PHARMACY keeps product search, pharmacy choice, cart requests,
                  profile data, and order history connected in one clear flow.
                </p>
              </div>

              <ul className={css.benefitsList}>
                {BENEFITS.map(({ id, title, text, icon: Icon }) => (
                  <li key={id}>
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
            <p className={css.kicker}>Product catalog</p>
            <h2 className={css.sectionTitle} id="products-title">
              Browse products available in pharmacies
            </h2>
            <p className={css.sectionText}>
              Open product cards, compare prices in pharmacies, check ratings,
              and add the right product to your cart from the catalog.
            </p>
          </div>

          <Suspense fallback={<FeaturedSectionFallback label="products" />}>
            <FeaturedProductsSection />
          </Suspense>

          <div className={css.sectionAction}>
            <LinkButton href={ROUTES.PRODUCTS_CATALOG} variant="secondary">
              View all products
            </LinkButton>
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

    </main>
  );
}

export default HomePage;
