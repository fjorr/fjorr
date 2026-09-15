import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Engine Intelligence matching used to scan film_filing with the service role
 * on every public ⌘K query. Retired for launch — discovery stays on search_items
 * + local ranking. Returns 410 so old clients fail closed.
 */
export async function GET(_req: NextRequest) {
  return NextResponse.json(
    {
      error: 'gone',
      prompts: [],
      matches: [],
      count: 0,
    },
    { status: 410 }
  );
}
