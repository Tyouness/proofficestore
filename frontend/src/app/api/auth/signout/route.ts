import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

// Client Supabase pour la déconnexion
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    console.log('[SIGNOUT] POST - Déconnexion demandée');
    
    // Retourner un succès - la déconnexion réelle se fait côté client
    return NextResponse.json({ 
      success: true, 
      redirectUrl: '/' 
    });
  } catch (error) {
    console.error('[SIGNOUT] Erreur:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erreur lors de la déconnexion' 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Redirection directe pour les liens GET
  console.log('[SIGNOUT] GET - Redirection vers /');
  return NextResponse.redirect(new URL('/', req.url));
}

