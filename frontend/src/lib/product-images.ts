// Helper pour mapper les slugs de produits vers les images locales
export function getProductImagePath(slug: string): string {
  const slugMap: Record<string, string> = {
    'windows-11-pro': '/products/windows-11-pro.webp',
    'windows-10-pro': '/products/windows-10-pro.webp',
    'office-2024-professional-plus': '/products/office-2024-pro.webp',
    'office-2021-professional-plus': '/products/office-2021-pro.webp',
    'office-2021-home-student': '/products/office-2021-home-student.webp',
    'office-2021-home-business': '/products/office-2021-home-business.webp',
    'office-2019-professional-plus': '/products/office-2019-pro.webp',
    'office-2019-home-student': '/products/office-2019-home-student.webp',
    'office-2019-home-business': '/products/office-2019-home-business.webp',
  };

  // Chercher la correspondance dans le slug
  for (const [key, imagePath] of Object.entries(slugMap)) {
    if (slug.startsWith(key)) {
      return imagePath;
    }
  }

  // Fallback : retourner chaîne vide
  return '';
}
