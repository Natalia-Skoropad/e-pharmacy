'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

import { Container } from '@e-pharmacy/ui/layout';
import { IconButton } from '@e-pharmacy/ui/primitives';

import {
  HOME_REVIEWS,
  HOME_REVIEWS_PROVENANCE,
} from '@/components/home/config/content';

import css from './HomeReviewsSection.module.css';

//===================================================================

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

//===================================================================

function HomeReviewsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeReview = HOME_REVIEWS[activeIndex];

  const showPrevious = () => {
    setActiveIndex((current) =>
      current === 0 ? HOME_REVIEWS.length - 1 : current - 1
    );
  };

  const showNext = () => {
    setActiveIndex((current) => (current + 1) % HOME_REVIEWS.length);
  };

  return (
    <section
      className={css.section}
      aria-labelledby="home-reviews-title"
      data-review-provenance={HOME_REVIEWS_PROVENANCE}
    >
      <Container>
        <header className={css.header}>
          <p className={css.kicker}>Sample experiences</p>
          <h2 className={css.title} id="home-reviews-title">
            A calmer way to manage medicines
          </h2>

          <p className={css.provenance}>
            Demo examples for interface presentation — not verified customer
            testimonials.
          </p>
        </header>

        <article className={css.card} aria-live="polite">
          <span className={css.demoBadge}>Demo example</span>

          <span className={css.avatar} aria-hidden="true">
            {getInitials(activeReview.author)}
          </span>

          <h3>{activeReview.author}</h3>

          <p
            className={css.rating}
            aria-label={`Illustrative rating ${activeReview.rating} out of 5`}
          >
            <Star size={16} fill="currentColor" aria-hidden="true" />
            <strong>{activeReview.rating.toFixed(1)}</strong>
          </p>

          <p className={css.comment}>{activeReview.comment}</p>
        </article>

        <div
          className={css.controls}
          role="group"
          aria-label="Sample experience controls"
        >
          <IconButton
            className={css.arrow}
            label="Show previous sample experience"
            size="sm"
            icon={<ChevronLeft size={18} aria-hidden="true" />}
            onClick={showPrevious}
          />

          <div className={css.dots}>
            {HOME_REVIEWS.map((review, index) => (
              <button
                className={css.dot}
                type="button"
                key={review.id}
                aria-label={`Show sample experience ${index + 1}`}
                aria-current={index === activeIndex ? 'true' : undefined}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>

          <IconButton
            className={css.arrow}
            label="Show next sample experience"
            size="sm"
            icon={<ChevronRight size={18} aria-hidden="true" />}
            onClick={showNext}
          />
        </div>
      </Container>
    </section>
  );
}

export default HomeReviewsSection;
