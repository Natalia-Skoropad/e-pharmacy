import { Container } from '@e-pharmacy/ui/layout';
import { Breadcrumbs } from '@e-pharmacy/ui/navigation';
import { SideMenu } from '@e-pharmacy/ui/cabinet';

import { createBreadcrumbs } from '@/lib/routes';

import { INFO_NAV_LINKS } from '@/components/info/config/navigation';

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

function createSectionId(title: string, index: number): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `section-${index + 1}-${slug || 'info'}`;
}

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

  const sectionLinks = sections.map((section, index) => ({
    ...section,
    id: createSectionId(section.title, index),
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

          <article
            className={css.content}
            aria-labelledby="info-page-title"
            aria-describedby="info-page-description"
          >
            <header className={css.header}>
              <p className={css.kicker}>E-PHARMACY information</p>
              <h1 className={css.title} id="info-page-title">
                {title}
              </h1>
              {updatedAt ? (
                <p className={css.updated}>
                  Updated <time dateTime={updatedAt}>{updatedAt}</time>
                </p>
              ) : null}
              <p className={css.description} id="info-page-description">
                {description}
              </p>
            </header>

            {highlights.length > 0 ? (
              <section
                className={css.highlightsSection}
                aria-labelledby="info-highlights-title"
              >
                <h2 className="visually-hidden" id="info-highlights-title">
                  Key information
                </h2>

                <ul className={css.highlights}>
                  {highlights.map((item) => (
                    <li className={css.highlightCard} key={item.title}>
                      <strong>{item.title}</strong>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <nav
              className={css.indexCard}
              aria-labelledby="info-page-index-title"
            >
              <h2 className={css.indexTitle} id="info-page-index-title">
                On this page
              </h2>
              <ol className={css.indexList}>
                {sectionLinks.map((section) => (
                  <li key={section.id}>
                    <a className={css.indexLink} href={`#${section.id}`}>
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className={css.sections}>
              {sectionLinks.map((section, index) => (
                <section
                  className={css.section}
                  id={section.id}
                  key={section.id}
                  aria-labelledby={`${section.id}-title`}
                >
                  <div className={css.sectionHead}>
                    <h2 id={`${section.id}-title`}>
                      {`${index + 1}. ${section.title}`}
                    </h2>
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
