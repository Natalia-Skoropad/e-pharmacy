import Link from 'next/link';
import { Facebook, Instagram, Youtube } from 'lucide-react';

import { Container, Logo } from '@e-pharmacy/ui/common';

import {
  CLIENT_FOOTER_LINKS,
  CLIENT_NAV_LINKS,
} from '@e-pharmacy/config/navigation';

import css from './Footer.module.css';

//===================================================================

const currentYear = new Date().getFullYear();

const SOCIAL_LINKS = [
  { label: 'Facebook', href: 'https://www.facebook.com/', icon: Facebook },
  { label: 'Instagram', href: 'https://www.instagram.com/', icon: Instagram },
  { label: 'YouTube', href: 'https://www.youtube.com/', icon: Youtube },
] as const;

//===================================================================

function Footer() {
  return (
    <footer className={css.footer}>
      <Container className={css.container}>
        <div className={css.topRow}>
          <div className={css.brand}>
            <Logo className={css.footerLogo} variant="white" />

            <p className={css.text}>
              E-PHARMACY helps clients explore pharmacy stores, find products,
              and prepare online orders.
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

          <ul className={css.socialList} aria-label="Social links">
            {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
              <li key={label}>
                <a
                  className={css.socialLink}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                >
                  <Icon size={18} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className={css.bottomRow}>
          <p className={css.copy}>
            © {currentYear} E-PHARMACY. All rights reserved.
          </p>

          <nav className={css.infoNav} aria-label="Footer legal navigation">
            <ul className={css.infoList}>
              {CLIENT_FOOTER_LINKS.map(({ label, href }) => (
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
