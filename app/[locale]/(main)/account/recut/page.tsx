import { permanentRedirect } from 'next/navigation';

/** Legacy path — Plus Machine lives at /account/plus. */
export default function AccountRecutRedirectPage() {
  permanentRedirect('/account/plus');
}
