import { Container } from '@e-pharmacy/ui/common';
import { Breadcrumbs, SideMenu } from '@e-pharmacy/ui/layout';

import { INFO_NAV_LINKS } from '@/components/info/config/navigation';
import { createBreadcrumbs } from '@/lib/routes';

import css from './InfoPage.module.css';

//===================================================================

type InfoSection = {
  title: string;
  content: readonly string[];
};

type InfoHighlight = {
  title: string;
  text: string;
};

type InfoPageProps = {
  title: string;
  description: string;
  activePath: string;
  updatedAt?: string;
  highlights?: readonly InfoHighlight[];
  sections: readonly InfoSection[];
};

//===================================================================

function InfoPage({
  title,
  description,
  activePath,
  updatedAt,
  highlights = [],
  sections,
}: InfoPageProps) {
  const sideMenuItems = INFO_NAV_LINKS.map(({ icon: Icon, ...item }) => ({
    ...item,
    icon: <Icon size={20} strokeWidth={1.8} aria-hidden="true" />,
  }));

  return (
    <main className={css.page}>
      <Container>
        <Breadcrumbs items={createBreadcrumbs(title)} />

        <div className={css.layout}>
          <SideMenu
            className={css.sidebar}
            ariaLabel="Information pages"
            items={sideMenuItems}
            activePath={activePath}
            showChevron
          />

          <article className={css.content}>
            <header className={css.header}>
              <p className={css.kicker}>E-PHARMACY information</p>
              <h1 className={css.title}>{title}</h1>
              {updatedAt ? (
                <p className={css.updated}>Updated {updatedAt}</p>
              ) : null}
              <p className={css.description}>{description}</p>
            </header>

            {highlights.length > 0 ? (
              <ul className={css.highlights}>
                {highlights.map((item) => (
                  <li className={css.highlightCard} key={item.title}>
                    <strong>{item.title}</strong>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className={css.indexCard}>
              <h2 className={css.indexTitle}>On this page</h2>
              <ol className={css.indexList}>
                {sections.map((section) => (
                  <li key={section.title}>{section.title}</li>
                ))}
              </ol>
            </div>

            <div className={css.sections}>
              {sections.map((section, index) => (
                <section className={css.section} key={section.title}>
                  <div className={css.sectionHead}>
                    <h2>{`${index + 1}. ${section.title}`}</h2>
                  </div>

                  <div className={css.sectionBody}>
                    {section.content.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </article>
        </div>
      </Container>
    </main>
  );
}

export default InfoPage;
