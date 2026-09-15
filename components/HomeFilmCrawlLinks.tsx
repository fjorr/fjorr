import { Link } from '@/i18n/navigation';

type CrawlFilm = {
  name: string;
  slug: string;
};

/**
 * Visually hidden film link graph for crawlers / assistive tech.
 * House stage is a client carousel — these <a>s give the homepage a crawlable film graph.
 */
export default function HomeFilmCrawlLinks({ films }: { films: CrawlFilm[] }) {
  const items = films.filter((f) => f.slug && f.name);
  if (!items.length) return null;

  return (
    <nav aria-label="Films" className="sr-only">
      <ul>
        {items.map((film) => (
          <li key={film.slug}>
            <Link href={`/film/${film.slug}`}>{film.name}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
