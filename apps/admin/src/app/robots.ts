import type { MetadataRoute } from 'next';

//===================================================================

function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      disallow: '/',
    },
  };
}

export default robots;
