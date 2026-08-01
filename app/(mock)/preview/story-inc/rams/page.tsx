import { redirect } from 'next/navigation';

/** Legacy path — use v1. */
export default function StoryIncRamsRedirect() {
  redirect('/preview/story-inc/v1');
}
