import { permanentRedirect } from 'next/navigation';

/** Legacy path — Plus Machine lives at /admin/plus. */
export default function AdminRecutRedirectPage() {
  permanentRedirect('/admin/plus');
}
