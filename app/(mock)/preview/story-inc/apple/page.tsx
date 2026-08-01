import { redirect } from 'next/navigation';

/** Legacy path — Apple edit is now v1. */
export default function StoryIncAppleRedirect() {
  redirect('/preview/story-inc/v1');
}
