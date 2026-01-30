import { NextRequest, NextResponse } from 'next/server';
import { sendPasswordResetConfirmationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email manquant' },
        { status: 400 }
      );
    }

    // Envoyer email de confirmation
    await sendPasswordResetConfirmationEmail(email);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API PASSWORD RESET CONFIRM] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
