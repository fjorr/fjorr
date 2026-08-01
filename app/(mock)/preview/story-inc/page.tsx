import { redirect } from 'next/navigation';

/** Default share URL — v1 (Apple edit) first. */
export default function StoryIncIndex() {
  redirect('/preview/story-inc/v1');
}
