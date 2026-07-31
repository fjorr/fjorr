import { permanentRedirect } from 'next/navigation';

/** Legacy path — The Cabinet lives at /cabinet. */
export default function BureauRedirectPage() {
  permanentRedirect('/cabinet');
}
