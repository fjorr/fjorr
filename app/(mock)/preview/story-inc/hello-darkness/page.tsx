import type { Metadata } from 'next';
import ProjectPage from '../ProjectPage';
import { projectPageMetadata } from '../project-metadata';
import { HELLO_DARKNESS } from '../projects/hello-darkness';

export const metadata: Metadata = projectPageMetadata({
  title: 'Hello Darkness, My Old Friend',
  description:
    'Follow Hello Darkness, My Old Friend on Story Inc — rewards, markets, and the project page.',
  path: '/preview/story-inc/hello-darkness',
  image: '/preview/story-inc/hello-darkness/hero-title.png',
});

/** Client comp — Hello Darkness on the shared project template. */
export default function HelloDarknessProjectPage() {
  return <ProjectPage data={HELLO_DARKNESS} />;
}
