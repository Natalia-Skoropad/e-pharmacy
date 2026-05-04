import Link from 'next/link';

import { Container, Logo } from '@/components/common';

import {
  CLIENT_FOOTER_LINKS,
  CLIENT_NAV_LINKS,
} from '@/lib/constants/navigation';

import css from './Footer.module.css';

//===================================================================

const currentYear = new Date().getFullYear();

//===================================================================

function Footer() {
  return (
    <footer className={css.footer}>
      <Container className={css.container}>
        <div className={css.brand}>
          <Logo />

          <p className={css.text}>
            E-PHARMACY helps customers explore pharmacy stores, find medicines,
            and prepare online orders.
          </p>
        </div>

        <nav className={css.nav} aria-label="Footer navigation">
          <ul className={css.linkList}>
            {[...CLIENT_NAV_LINKS, ...CLIENT_FOOTER_LINKS].map(
              ({ label, href }) => (
                <li key={href}>
                  <Link className={css.link} href={href}>
                    {label}
                  </Link>
                </li>
              )
            )}
          </ul>
        </nav>

        <p className={css.copy}>
          © {currentYear} E-PHARMACY. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}

export default Footer;
