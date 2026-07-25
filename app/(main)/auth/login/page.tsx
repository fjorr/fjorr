import { redirect } from 'next/navigation';

/** Legacy password login → magic-link sign-in. */
export default function LoginRedirectPage() {
  redirect('/signin');
}
