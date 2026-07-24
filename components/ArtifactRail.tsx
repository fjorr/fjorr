'use client';

import PosterRail from '@/components/PosterRail';

interface ArtifactRailProps {
  title: string;
  artifacts: any[];
}

export default function ArtifactRail({ title, artifacts: rawArtifacts }: ArtifactRailProps) {
  const items = (rawArtifacts || [])
    .map((item, index) => {
      const artifact = item?.artifact ? item.artifact : item;
      if (!artifact?.slug) return null;
      return {
        key: String(artifact.id || artifact.slug || index),
        href: `/artifact/${artifact.slug}`,
        image: artifact.blok_tall as string | undefined,
        label: artifact.name as string | undefined,
      };
    })
    .filter(Boolean) as { key: string; href: string; image?: string; label?: string }[];

  return <PosterRail title={title} items={items} />;
}
