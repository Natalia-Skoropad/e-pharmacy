import type { Metadata } from 'next';

import {
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_ALT,
  SITE_NAME,
} from '@/lib/constants/metadata';

import { createAbsoluteUrl } from '@/lib/seo/url';

//===================================================================

type CreatePageMetadataParams = {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  noIndex?: boolean;
};

//===================================================================

export function createPageMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  imageAlt = DEFAULT_OG_IMAGE_ALT,
  noIndex = false,
}: CreatePageMetadataParams): Metadata {
  const absoluteUrl = createAbsoluteUrl(path);

  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl,
    },

    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title,
      description,
      url: absoluteUrl,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
    },

    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },

    robots: noIndex
      ? {
          index: false,
          follow: true,
        }
      : {
          index: true,
          follow: true,
        },
  };
}
