import type { Metadata } from 'next';
import ProjectPage from '../ProjectPage';
import { projectPageMetadata } from '../project-metadata';
import { NOTORIOUS_GOD } from '../projects/notorious-god';

export const metadata: Metadata = projectPageMetadata({
  title: 'The Notorious G.O.D.',
  description:
    'Follow The Notorious G.O.D. on Story Inc — rewards, markets, and the project page.',
  path: '/preview/story-inc/notorious-god',
  image: '/preview/story-inc/notorious-god/hero-title.jpg',
});

/** Client comp — The Notorious G.O.D. on the shared project template. */
export default function NotoriousGodProjectPage() {
  return <ProjectPage data={NOTORIOUS_GOD} />;
}
