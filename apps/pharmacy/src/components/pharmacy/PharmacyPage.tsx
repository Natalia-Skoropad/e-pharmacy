import Link from 'next/link';

import { getPharmacyDashboardPath } from '@/lib/pharmacy/routes';

import css from './PharmacyPage.module.css';

//===================================================================

type PharmacyPageProps = Readonly<{
  title: string;
  description: string;
  children?: React.ReactNode;
}>;

//===================================================================

export function PharmacyPage({ title, description, children }: PharmacyPageProps) {
  return (
    <main className={css.page}>
      <nav className={css.breadcrumbs} aria-label="Breadcrumbs">
        <Link href={getPharmacyDashboardPath()}>Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{title}</span>
      </nav>

      <section className={css.hero} aria-labelledby="page-title">
        <p className={css.kicker}>Pharmacy cabinet</p>
        <h1 id="page-title">{title}</h1>
        <p>{description}</p>
      </section>

      {children ? <div className={css.content}>{children}</div> : null}
    </main>
  );
}
