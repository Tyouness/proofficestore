import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Charger .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Test de connexion Supabase...\n');
console.log('URL:', supabaseUrl?.substring(0, 30) + '...');
console.log('Key présente:', !!supabaseKey, '\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes !');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test 1: Récupérer tous les produits
console.log('📦 Test 1: Récupérer tous les produits actifs...');
const { data: allProducts, error: error1 } = await supabase
  .from('products')
  .select('id, slug, name, is_active, is_featured')
  .eq('is_active', true);

if (error1) {
  console.error('❌ Erreur:', {
    message: error1.message,
    details: error1.details,
    hint: error1.hint,
    code: error1.code
  });
} else {
  console.log(`✅ ${allProducts?.length || 0} produits actifs trouvés`);
  if (allProducts?.length > 0) {
    console.log('   Premiers produits:', allProducts.slice(0, 3).map(p => p.name));
  }
}

// Test 2: Récupérer les produits vedettes
console.log('\n⭐ Test 2: Récupérer les produits vedettes (is_featured=true)...');
const { data: featuredProducts, error: error2 } = await supabase
  .from('products')
  .select('id, slug, name, is_featured')
  .eq('is_featured', true)
  .eq('is_active', true)
  .limit(4);

if (error2) {
  console.error('❌ Erreur:', {
    message: error2.message,
    details: error2.details,
    hint: error2.hint,
    code: error2.code
  });
} else {
  console.log(`✅ ${featuredProducts?.length || 0} produits vedettes trouvés`);
  if (featuredProducts?.length > 0) {
    console.log('   Produits vedettes:', featuredProducts.map(p => p.name));
  }
}

// Test 3: Vérifier les colonnes multi-currency
console.log('\n💰 Test 3: Vérifier les colonnes de prix multi-currency...');
const { data: priceTest, error: error3 } = await supabase
  .from('products')
  .select('slug, base_price, price_eur, price_usd, sale_price_eur, promo_label_eur')
  .limit(1)
  .single();

if (error3) {
  console.error('❌ Erreur:', {
    message: error3.message,
    details: error3.details,
    hint: error3.hint,
    code: error3.code
  });
} else {
  console.log('✅ Colonnes de prix accessibles:', Object.keys(priceTest || {}));
}

console.log('\n✅ Tests terminés !');
