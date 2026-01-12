import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    // Supprimer le cookie d'authentification
    const cookieStore = await cookies();
    cookieStore.delete('sb-hzptzuljmexfflefxwqy-auth-token');

    // Rediriger vers la page de connexion
    return NextResponse.redirect(new URL('/login', req.url));
  } catch (error) {
    console.error('Error signing out:', error);
    return NextResponse.redirect(new URL('/', req.url));
  }
}

export async function GET(req: NextRequest) {
  // Permettre la déconnexion via GET également (pour les liens <a>)
  return POST(req);
}
