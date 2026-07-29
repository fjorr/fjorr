import { redirect } from 'next/navigation';

/** Old /bureau path → /bureaux */
export default function BureauRedirectPage() {
  redirect('/bureaux');
}
