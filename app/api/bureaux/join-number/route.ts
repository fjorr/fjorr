import { NextResponse } from 'next/server';
import { getBureauxNumberForEmail } from '@/lib/bureaux';

export const runtime = 'nodejs';

/**
 * After guest checkout — resolve the new Bureaux No. for the claim screen.
 * Body: { email: string }
 */
export async function POST(request: Request) {
  let email: string | null = null;
  try {
    const body = (await request.json()) as { email?: unknown };
    if (typeof body.email === 'string') email = body.email;
  } catch {
    return NextResponse.json({ error: 'badRequest' }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ error: 'emailRequired' }, { status: 400 });
  }

  const number = await getBureauxNumberForEmail(email);
  return NextResponse.json({ number });
}
