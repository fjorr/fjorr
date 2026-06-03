// app/api/gate/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    // 🎯 CHOOSE YOUR PHRASE: Set this to whatever entry key you want
    const BACKDOOR_PASSWORD = process.env.SITE_PASSWORD || 'fjorr-preview-2026';

    if (password === BACKDOOR_PASSWORD) {
      const response = NextResponse.json({ success: true });
      
      // Drop the 'site-auth' cookie that your middleware is looking for
      response.cookies.set('site-auth', 'true', {
        httpOnly: true, // Prevents browser scripts from reading or stealing the token
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // Token lasts for 7 days
        path: '/',
      });

      return response;
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}