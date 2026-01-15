import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/account/',
          '/_next/',
          '/checkout/cancel',
        ],
      },
    ],
    sitemap: 'https://www.allkeymasters.com/sitemap.xml',
  };
}
