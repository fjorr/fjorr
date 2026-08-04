import type { Metadata } from 'next';
import ProjectPage from '../ProjectPage';
import { projectPageMetadata } from '../project-metadata';
import { ANGRY_BIRDS } from '../projects/angry-birds';

export const metadata: Metadata = projectPageMetadata({
  title: 'Angry Birds 3',
  description:
    'Follow Angry Birds 3 on Story Inc — rewards, markets, and the project page.',
  path: '/preview/story-inc/angry-birds',
  image: '/preview/story-inc/trailer-poster.png',
});

/** Client comp — Angry Birds 3 on the shared Rolling Loud template. */
export default function AngryBirdsProjectPage() {
  return <ProjectPage data={ANGRY_BIRDS} />;
}
