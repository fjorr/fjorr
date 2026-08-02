import type { Metadata } from 'next';
import ProjectPage from '../ProjectPage';
import { projectPageMetadata } from '../project-metadata';
import { ROLLING_LOUD } from '../projects/rolling-loud';

export const metadata: Metadata = projectPageMetadata({
  title: 'Rolling Loud',
  description:
    'Follow Rolling Loud on Story Inc — rewards, markets, and the project page.',
  path: '/preview/story-inc/rolling-loud',
  image: '/preview/story-inc/rolling-loud/hero-trailer.png',
});

/** Client comp — Rolling Loud on the Angry Birds v1 template. */
export default function RollingLoudProjectPage() {
  return <ProjectPage data={ROLLING_LOUD} />;
}
