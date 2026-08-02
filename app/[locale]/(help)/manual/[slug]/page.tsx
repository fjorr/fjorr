import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import HelpArticleView from '@/components/help/HelpArticleView';
import {
  getHelpArticle,
  listHelpArticles,
} from '@/lib/help/content';

export function generateStaticParams() {
  return listHelpArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getHelpArticle(slug);
  if (!article) return { title: 'Help' };
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `/manual/${article.slug}` },
  };
}

export default async function HelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getHelpArticle(slug);
  if (!article) notFound();

  return <HelpArticleView article={article} />;
}
