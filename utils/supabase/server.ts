import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  // 1. Declare a safe fallback variable at the top layer
  let cookieStore: any = null;
  
  try {
    // 2. Await the native Next.js async cookie resolution directly
    cookieStore = await cookies();
  } catch {
    // Falls back gracefully if run outside of an active request layout context (e.g., static generation)
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // If cookieStore exists, fetch all cookies; otherwise return an empty array
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