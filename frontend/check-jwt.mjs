// Décoder le JWT pour voir sa date d'expiration
const token = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6cHR6dWxqbWV4ZmZsZWZ4d3F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MDg4MzYsImV4cCI6MjA4MjE4NDgzNn0.lOUXx0Z4DyXl9Iv21YOQLGPl9kXugVgxt0xWxmiEek8";

const parts = token.split('.');
if (parts.length !== 3) {
  console.log('❌ Token invalide');
  process.exit(1);
}

const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

console.log('📅 Informations du JWT Supabase:\n');
console.log('Émis le (iat):', new Date(payload.iat * 1000).toLocaleString('fr-FR'));
console.log('Expire le (exp):', new Date(payload.exp * 1000).toLocaleString('fr-FR'));
console.log('Projet (ref):', payload.ref);
console.log('Rôle:', payload.role);
console.log('\n⏰ Date actuelle:', new Date().toLocaleString('fr-FR'));

const now = Math.floor(Date.now() / 1000);
const isExpired = now > payload.exp;
const daysUntilExpiry = Math.floor((payload.exp - now) / 86400);

if (isExpired) {
  console.log('\n❌ LE TOKEN A EXPIRÉ !');
  const daysExpired = Math.floor((now - payload.exp) / 86400);
  console.log(`   Expiré depuis ${daysExpired} jour(s)`);
} else {
  console.log(`\n✅ Token encore valide pour ${daysUntilExpiry} jour(s)`);
}
