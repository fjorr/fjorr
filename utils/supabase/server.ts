import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
// 🌟 IMPORT THE TYPE WE NEED:
import { type ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

export async function createClient() {
  // 🌟 FIX: Explicitly tell TypeScript what this variable is going to be!
  let cookieStore: ReadonlyRequestCookies | undefined;
  
  try {
    cookieStore = await cookies();
  } catch {
    // Falls back gracefully if run outside of an active request layout context
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore ? cookieStore.getAll() : [];
        },
        setAll(cookiesToSet) {
          if (!cookieStore) return;
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The cookies.set method was called from a Server Component.
            // This can be ignored if you have middleware handling cookie refreshes.
          }
        },
      },
    }
  );
}