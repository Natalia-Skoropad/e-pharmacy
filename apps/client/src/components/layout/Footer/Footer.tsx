import Link from 'next/link';

import { Logo } from '@e-pharmacy/ui/media';
import { Container } from '@e-pharmacy/ui/layout';

import { CLIENT_NAV_LINKS } from '@/components/layout/config/navigation';
import { INFO_LINKS } from '@/components/info/config/links';

import css from './Footer.module.css';

//===================================================================

const currentYear = new Date().getFullYear();

//===================================================================

function Footer() {
  return (
    <footer className={css.footer}>
      <Container className={css.container}>
        <div className={css.topRow}>
          <div className={css.brand}>
            <Logo className={css.footerLogo} variant="white" />

            <p className={css.text}>
              E-PHARMACY helps clients explore pharmacies, find products, and
              prepare order requests for pharmacy confirmation.
            </p>
          </div>

          <nav className={css.mainNav} aria-label="Footer main navigation">
            <ul className={css.mainList}>
              {CLIENT_NAV_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link className={css.mainLink} href={href}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className={css.bottomRow}>
          <p className={css.copy}>
            © {currentYear} E-PHARMACY. All rights reserved.
          </p>

          <nav className={css.infoNav} aria-label="Footer legal navigation">
            <ul className={css.infoList}>
              {INFO_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link className={css.infoLink} href={href}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
