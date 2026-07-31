import { LinkButton } from '@e-pharmacy/ui/navigation';

import { HOME_FEATURES } from '@/components/home/config/content';

import css from './HomeFeatureCards.module.css';

//===================================================================

function HomeFeatureCards() {
  return (
    <div className={css.featuresGrid}>
      {HOME_FEATURES.map(({ id, icon: Icon, ...feature }) => (
        <article className={css.featureCard} key={id}>
          <span className={css.iconWrap} aria-hidden="true">
            <Icon size={26} />
          </span>
          <h3>{feature.title}</h3>
          <p>{feature.text}</p>

          <LinkButton
            className={css.featureAction}
            href={feature.href}
            variant="secondary"
          >
            {feature.actionLabel}
          </LinkButton>
        </article>
      ))}
    </div>
  );
}

export default HomeFeatureCards;
