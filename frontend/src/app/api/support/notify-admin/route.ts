import { NextRequest, NextResponse } from 'next/server';
import { sendSupportReplyNotificationToAdmin } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { ticketId, subject, customerEmail, messagePreview } = await req.json();

    if (!ticketId || !subject || !customerEmail || !messagePreview) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Envoyer email à l'admin
    await sendSupportReplyNotificationToAdmin(
      ticketId,
      subject,
      customerEmail,
      messagePreview
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API SUPPORT NOTIFY ADMIN] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
