import { LinkButton } from '@e-pharmacy/ui/navigation';

import { HOME_FEATURES } from '@/components/home/config/content';

import css from './HomeFeatureCards.module.css';

//===================================================================

function HomeFeatureCards() {
  return (
    <div className={css.featuresGrid}>
      {HOME_FEATURES.map(({ id, icon: Icon, ...feature }) => (
        <article className={css.featureCard} key={id}>
          <div className={css.cardHeader}>
            <span className={css.iconWrap} aria-hidden="true">
              <Icon size={26} />
            </span>

            <div className={css.headingGroup}>
              <p className={css.eyebrow}>{feature.eyebrow}</p>
              <h3>{feature.title}</h3>
            </div>
          </div>

          <p>{feature.text}</p>

          <div className={css.cardFooter}>
            <ul className={css.highlights}>
              {feature.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>

            <LinkButton
              className={css.featureAction}
              href={feature.href}
              variant="secondary"
            >
              {feature.actionLabel}
            </LinkButton>
          </div>
        </article>
      ))}
    </div>
  );
}

export default HomeFeatureCards;
