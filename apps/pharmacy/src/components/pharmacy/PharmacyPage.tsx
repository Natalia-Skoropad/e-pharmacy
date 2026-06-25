import { Breadcrumbs, type BreadcrumbItem } from '@e-pharmacy/ui/layout';

import css from './PharmacyPage.module.css';

//===================================================================

type PharmacyPageProps = Readonly<{
  title: string;
  description: string;
  breadcrumbs?: BreadcrumbItem[];
  children?: React.ReactNode;
}>;

//===================================================================

export function PharmacyPage({
  title,
  description,
  children,
  breadcrumbs = [{ label: 'Dashboard', href: '/pharmacy/dashboard' }, { label: title }],
}: PharmacyPageProps) {
  return (
    <main className={css.page}>
      <Breadcrumbs items={breadcrumbs} className={css.breadcrumbs} />

      <section className={css.hero} aria-labelledby="page-title">
        <p className={css.kicker}>Pharmacy cabinet</p>
        <h1 id="page-title">{title}</h1>
        <p>{description}</p>
      </section>

      {children ? <div className={css.content}>{children}</div> : null}
    </main>
  );
}
