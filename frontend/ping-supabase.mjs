import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://hzptzuljmexfflefxwqy.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6cHR6dWxqbWV4ZmZsZWZ4d3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MDg4MzYsImV4cCI6MjA4MjE4NDgzNn0.lOUXx0Z4DyXl9Iv21YOQLGPl9kXugVgxt0xWxmiEek8";

console.log('🔍 Test de connexion au projet Supabase...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

// Test simple: liste des tables
const { data, error } = await supabase
  .from('products')
  .select('count', { count: 'exact', head: true });

if (error) {
  console.error('❌ Erreur de connexion:', error);
  console.log('\n💡 Solutions possibles:');
  console.log('   1. Vérifiez que le projet Supabase existe sur https://supabase.com/dashboard');
  console.log('   2. Le projet peut être en pause (plan gratuit)');
  console.log('   3. Créez un nouveau projet si celui-ci est corrompu');
} else {
  console.log('✅ Connexion réussie !');
  console.log('   Nombre de produits:', data);
}
