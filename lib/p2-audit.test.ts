import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { marketingShareImages } from './seo/og';

const root = join(import.meta.dirname, '..');

describe('marketingShareImages', () => {
  it('returns absolute OG + twitter image URLs', () => {
    const { openGraphImages, twitterImages } = marketingShareImages('About');
    const first = Array.isArray(openGraphImages) ? openGraphImages[0] : openGraphImages;
    assert.ok(first && typeof first === 'object' && 'url' in first);
    assert.match(String(first.url), /^https:\/\//);
    assert.equal(first.alt, 'About');
    assert.equal(twitterImages.length, 1);
    assert.match(twitterImages[0], /^https:\/\//);
  });
});

describe('P2 audit guards', () => {
  it('long-caches fonts and static assets', () => {
    const cfg = readFileSync(join(root, 'next.config.ts'), 'utf8');
    assert.match(cfg, /\/fonts\/:path\*/);
    assert.match(cfg, /\/_next\/static\/:path\*/);
    assert.match(cfg, /max-age=31536000/);
  });

  it('keeps a single film h1 (FilmSeoCopy; stage uses h2)', () => {
    const seo = readFileSync(
      join(root, 'components/house/FilmSeoCopy.tsx'),
      'utf8',
    );
    const stage = readFileSync(
      join(root, 'components/house/FilmStage.tsx'),
      'utf8',
    );
    assert.match(seo, /<h1>\{name\}<\/h1>/);
    assert.match(stage, /titleAs="h2"/);
  });

  it('wires marketingShareImages on marketing routes', () => {
    const routes = [
      'app/[locale]/(main)/about/page.tsx',
      'app/[locale]/(main)/about/the-mark/page.tsx',
      'app/[locale]/(main)/about/100-years-of-failure/page.tsx',
      'app/[locale]/(main)/bureaux/page.tsx',
      'app/[locale]/(main)/subscribe/page.tsx',
      'app/[locale]/(main)/privacy/page.tsx',
      'app/[locale]/(main)/terms/page.tsx',
    ];
    for (const route of routes) {
      const src = readFileSync(join(root, route), 'utf8');
      assert.match(src, /marketingShareImages/, route);
      assert.match(src, /openGraphImages/, route);
    }
  });
});
