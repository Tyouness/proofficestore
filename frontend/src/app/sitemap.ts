import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const SITE_URL = 'https://www.allkeymasters.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/logiciels`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/support`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/cart`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/legal/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/legal/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/legal/refund`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/legal/imprint`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  try {
    // Récupérer tous les produits actifs
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('slug, created_at')
      .eq('is_active', true);

    if (error) {
      console.error('[SITEMAP] Erreur Supabase:', error);
      return staticPages;
    }

    const productPages: MetadataRoute.Sitemap = (products || []).map((product) => ({
      url: `${SITE_URL}/produit/${product.slug}`,
      lastModified: product.created_at ? new Date(product.created_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    }));

    return [...staticPages, ...productPages];
  } catch (error) {
    console.error('[SITEMAP] Erreur inattendue:', error);
    return staticPages;
  }
}
