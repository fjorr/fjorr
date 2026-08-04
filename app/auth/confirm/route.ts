import { handleAuthConfirm } from '@/lib/auth/confirm-route';
import { type NextRequest } from 'next/server';

/** Locale-free magic-link / OAuth callback — emailRedirectTo targets this path. */
export async function GET(request: NextRequest) {
  return handleAuthConfirm(request);
}
