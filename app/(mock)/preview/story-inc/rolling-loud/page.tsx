import type { Metadata } from 'next';
import ProjectPage from '../ProjectPage';
import { ROLLING_LOUD } from '../projects/rolling-loud';

export const metadata: Metadata = {
  title: 'Rolling Loud',
  description:
    'Follow Rolling Loud on Story Inc — rewards, markets, and the project page.',
};

/** Client comp — Rolling Loud on the Angry Birds v1 template. */
export default function RollingLoudProjectPage() {
  return <ProjectPage data={ROLLING_LOUD} />;
}
