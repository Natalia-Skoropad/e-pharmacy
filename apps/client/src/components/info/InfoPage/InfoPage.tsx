import Link from 'next/link';

import { ChevronRight, Plus } from 'lucide-react';

import { Container } from '@/components/common';

import { INFO_NAV_LINKS } from '@/lib/constants/navigation';
import { cn } from '@/lib/utils';

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
  return (
    <main className={css.page}>
      <Container>
        <div className={css.layout}>
          <aside className={css.sidebar} aria-label="Information pages">
            <nav>
              <ul className={css.sideList}>
                {INFO_NAV_LINKS.map((link) => {
                  const isActive = link.href === activePath;

                  return (
                    <li key={link.href}>
                      <Link
                        className={cn(css.sideLink, isActive && css.active)}
                        href={link.href}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <span>{link.label}</span>
                        <ChevronRight size={20} aria-hidden="true" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          <article className={css.content}>
            <header className={css.header}>
              <p className={css.kicker}>E-PHARMACY information</p>
              <h1 className={css.title}>{title}</h1>
              {updatedAt ? <p className={css.updated}>Updated {updatedAt}</p> : null}
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
                    <Plus size={30} aria-hidden="true" />
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
