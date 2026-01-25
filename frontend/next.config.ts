import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  /* config options here */
  
  // ── Image Optimization ──
  images: {
    qualities: [75, 85],
  },
  
  // ── Security Headers ──
  async headers() {
    return [
      {
        // Appliquer uniquement sur les pages (pas /api/*)
        source: '/((?!api).*)',
        headers: [
          // Content Security Policy (strict en prod, relaxé en dev)
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Script: strict en prod, relaxé en dev (HMR nécessite unsafe-eval)
              isProd
                ? "script-src 'self' 'unsafe-inline' https://js.stripe.com" // Pas unsafe-eval en prod
                : "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com", // Dev: HMR
              "style-src 'self' 'unsafe-inline'", // Tailwind inline styles
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              // Connect: URL exacte Supabase (remplacer hzptzuljmexfflefxwqy par votre project)
              `connect-src 'self' https://hzptzuljmexfflefxwqy.supabase.co https://api.stripe.com${isProd ? '' : ' ws://localhost:*'}`, // Dev: HMR websocket
              "frame-src https://js.stripe.com https://hooks.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              ...(isProd ? ["upgrade-insecure-requests"] : []),
            ].join('; '),
          },
          // Empêche MIME sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Empêche iframe (clickjacking)
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Force HTTPS (prod uniquement)
          ...(isProd ? [{
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          }] : []),
          // Contrôle referrer
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions API
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  
  // ── Redirections SEO ──
  async redirects() {
    return [
      // Redirection 301: anciennes URLs /product vers nouvelles URLs /produit
      {
        source: '/product/:slug*',
        destination: '/produit/:slug*',
        permanent: true, // 301 redirect
      },
    ];
  },
};

export default nextConfig;
