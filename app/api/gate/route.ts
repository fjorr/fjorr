import { NextResponse } from 'next/server';
import { createGateToken } from '@/lib/site-gate';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const expectedPassword = process.env.SITE_PASSWORD;

    // Fail closed: no hardcoded fallback. Gate requires SITE_PASSWORD.
    if (!expectedPassword) {
      console.error('SITE_PASSWORD is not configured');
      return NextResponse.json({ error: 'Gate unavailable' }, { status: 503 });
    }

    if (typeof password !== 'string' || password !== expectedPassword) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = await createGateToken(expectedPassword);
    const response = NextResponse.json({ success: true });

    response.cookies.set('site-auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
