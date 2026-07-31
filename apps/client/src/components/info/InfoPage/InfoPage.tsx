import { Container } from '@e-pharmacy/ui/layout';
import { Breadcrumbs } from '@e-pharmacy/ui/navigation';

import { createBreadcrumbs } from '@/lib/routes';
import type { InfoPageData } from '@/components/info/config/types';
import { InfoNavigation } from '@/components/info/InfoNavigation/InfoNavigation';

import css from './InfoPage.module.css';

//===================================================================

export type InfoPageProps = Readonly<{
  data: InfoPageData;
}>;

//===================================================================

function InfoPage({ data }: InfoPageProps) {
  const {
    title,
    description,
    path,
    metadata,
    highlights = [],
    sections,
  } = data;

  return (
    <main className={css.page}>
      <Container>
        <Breadcrumbs items={createBreadcrumbs(title)} />

        <div className={css.layout}>
          <InfoNavigation className={css.sidebar} activePath={path} />

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

              <p className={css.updated}>
                Version {metadata.version} · Updated{' '}
                <time dateTime={metadata.updatedAt.iso}>
                  {metadata.updatedAt.label}
                </time>
                {metadata.effectiveAt ? (
                  <>
                    {' '}
                    · Effective{' '}
                    <time dateTime={metadata.effectiveAt.iso}>
                      {metadata.effectiveAt.label}
                    </time>
                  </>
                ) : null}
              </p>

              {metadata.approvalStatus !== 'approved' ? (
                <p className={css.documentStatus}>
                  {metadata.approvalStatus === 'in_review'
                    ? 'This document is under formal review.'
                    : 'Draft document: formal approval is not recorded.'}
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
                    <li className={css.highlightCard} key={item.id}>
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
                {sections.map((section) => (
                  <li key={section.id}>
                    <a className={css.indexLink} href={`#${section.id}`}>
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className={css.sections}>
              {sections.map((section, sectionIndex) => (
                <section
                  className={css.section}
                  id={section.id}
                  key={section.id}
                  aria-labelledby={`${section.id}-title`}
                >
                  <div className={css.sectionHead}>
                    <h2 id={`${section.id}-title`}>
                      {`${sectionIndex + 1}. ${section.title}`}
                    </h2>
                  </div>

                  <div className={css.sectionBody}>
                    {section.content.map((paragraph, paragraphIndex) => (
                      <p key={`${section.id}-paragraph-${paragraphIndex}`}>
                        {paragraph}
                      </p>
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
