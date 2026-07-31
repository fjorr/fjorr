import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPublicBountyBySlug } from '@/lib/nomination-actions';
import BountyBriefClient from './BountyBriefClient';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const bounty = await getPublicBountyBySlug(slug);
  if (!bounty) {
    return { title: 'Bounty' };
  }

  const description =
    bounty.brief.slice(0, 160) || `Fjorr bounty: ${bounty.title}`;

  return {
    title: bounty.title,
    description,
    alternates: { canonical: `/bounties/${bounty.slug}` },
    openGraph: {
      title: `${bounty.title} | Fjorr`,
      description,
      url: `https://www.fjorr.com/bounties/${bounty.slug}`,
      type: 'website',
      ...(bounty.poster_image_url
        ? { images: [{ url: bounty.poster_image_url }] }
        : {}),
    },
    twitter: {
      title: `${bounty.title} | Fjorr`,
      description,
      ...(bounty.poster_image_url ? { images: [bounty.poster_image_url] } : {}),
    },
  };
}

export default async function BountyBriefPage({ params }: PageProps) {
  const { slug } = await params;
  const bounty = await getPublicBountyBySlug(slug);
  if (!bounty) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <BountyBriefClient bounty={bounty} signedIn={!!user} />;
}
