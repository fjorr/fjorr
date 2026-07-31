import { permanentRedirect } from 'next/navigation';

/** Legacy path — The Cabinet lives at /admin/cabinet. */
export default function AdminBureauxRedirectPage() {
  permanentRedirect('/admin/cabinet');
}
