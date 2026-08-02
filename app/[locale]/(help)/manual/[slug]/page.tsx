import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import ManualEntryView from '@/components/help/ManualEntryView';
import { getManualViewer } from '@/lib/help/audience';
import {
  MANUAL_LEGACY_REDIRECTS,
  getManualEntry,
  listManualEntries,
  manualEntryHref,
} from '@/lib/help/content';

export function generateStaticParams() {
  return listManualEntries().map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const legacy = MANUAL_LEGACY_REDIRECTS[slug];
  if (legacy) {
    const entry = getManualEntry(legacy);
    return { title: entry?.title || 'The Manual' };
  }
  const entry = getManualEntry(slug);
  if (!entry) return { title: 'The Manual' };
  return {
    title: `${entry.number} ${entry.title}`,
    description: entry.what,
    alternates: { canonical: manualEntryHref(entry.slug) },
  };
}

export default async function ManualEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const legacy = MANUAL_LEGACY_REDIRECTS[slug];
  if (legacy && legacy !== slug) {
    permanentRedirect(manualEntryHref(legacy));
  }

  const entry = getManualEntry(slug);
  if (!entry) notFound();

  const viewer = await getManualViewer();

  return (
    <ManualEntryView
      entry={entry}
      audience={viewer.audience}
      bureauxNumber={viewer.bureauxNumber}
    />
  );
}
