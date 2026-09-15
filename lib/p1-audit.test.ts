import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createGateToken, isSearchCrawler, isSocialCrawler } from './site-gate';
import { matchesSearchText, scoreSearchFields } from './search-match';
import { buildAlternates, localizedPath } from './seo/alternates';

describe('site-gate crawlers', () => {
  it('treats Googlebot as search, not social', () => {
    assert.equal(isSearchCrawler('Mozilla/5.0 (compatible; Googlebot/2.1)'), true);
    assert.equal(isSocialCrawler('Mozilla/5.0 (compatible; Googlebot/2.1)'), false);
  });

  it('treats Twitterbot as social', () => {
    assert.equal(isSocialCrawler('Twitterbot/1.0'), true);
    assert.equal(isSearchCrawler('Twitterbot/1.0'), false);
  });
});

describe('createGateToken', () => {
  it('is stable for a secret', async () => {
    const a = await createGateToken('test-secret');
    const b = await createGateToken('test-secret');
    assert.equal(a, b);
    assert.ok(a.length > 16);
  });
});

describe('search token prefix', () => {
  it('matches bill bow → Bill Bowerman', () => {
    assert.equal(matchesSearchText('Bill Bowerman', 'bill bow'), true);
    assert.ok(scoreSearchFields({ name: 'Bill Bowerman' }, 'bill bow') > 0);
  });

  it('rejects unrelated titles', () => {
    assert.equal(matchesSearchText('Unexpected Champion', 'bill bow'), false);
    assert.equal(scoreSearchFields({ name: 'Unexpected Champion' }, 'bill bow'), 0);
  });
});

describe('hreflang helpers', () => {
  it('prefixes non-default locales', () => {
    assert.equal(localizedPath('en', '/film/x'), '/film/x');
    assert.equal(localizedPath('fr', '/film/x'), '/fr/film/x');
    assert.equal(localizedPath('es', '/'), '/es');
  });

  it('builds languages map with x-default', () => {
    const alt = buildAlternates('/about', 'de');
    assert.ok(String(alt.canonical).includes('/de/about'));
    assert.ok(String(alt.languages?.['x-default']).includes('/about'));
    assert.ok(String(alt.languages?.en).endsWith('/about'));
  });
});
