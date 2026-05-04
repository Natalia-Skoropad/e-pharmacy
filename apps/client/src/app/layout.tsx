import type { Metadata } from 'next';

import AppShell from '@/components/layout/AppShell';

import {
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_ALT,
  HOME_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from '@/lib/constants/metadata';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: HOME_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: HOME_DESCRIPTION,
    url: '/',
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: DEFAULT_OG_IMAGE_ALT,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: HOME_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="uk">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

export default RootLayout;
