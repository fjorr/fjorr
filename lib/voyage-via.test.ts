/**
 * Pure lineage helpers — organic / hop / self / immutability.
 * Run: npx tsx --test lib/voyage-via.test.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  filmSharePath,
  filmViaSharePath,
  parseViaMemberNumber,
  resolveReferrerUserId,
  stampReferredByOnFirstLog,
  viaCookieName,
} from './voyage-via';

describe('parseViaMemberNumber', () => {
  it('accepts positive integers', () => {
    assert.equal(parseViaMemberNumber('42'), 42);
    assert.equal(parseViaMemberNumber('1'), 1);
  });

  it('rejects junk and non-canonical forms', () => {
    assert.equal(parseViaMemberNumber(null), null);
    assert.equal(parseViaMemberNumber(''), null);
    assert.equal(parseViaMemberNumber('0'), null);
    assert.equal(parseViaMemberNumber('-3'), null);
    assert.equal(parseViaMemberNumber('12.5'), null);
    assert.equal(parseViaMemberNumber('07'), null);
    assert.equal(parseViaMemberNumber('abc'), null);
  });
});

describe('filmViaSharePath', () => {
  it('builds /film/{slug}?via={memberNumber}', () => {
    assert.equal(filmViaSharePath('north-wind', 7), '/film/north-wind?via=7');
  });
});

describe('filmSharePath', () => {
  it('omits via when signed out', () => {
    assert.equal(filmSharePath({ slug: 'north-wind' }), '/film/north-wind');
  });

  it('combines via and timestamp', () => {
    assert.equal(
      filmSharePath({ slug: 'north-wind', memberNumber: 7, atSeconds: 84 }),
      '/film/north-wind?via=7&t=84'
    );
  });
});

describe('viaCookieName', () => {
  it('keys cookie by film id', () => {
    assert.equal(
      viaCookieName('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'),
      'fjorr_via_aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
    );
  });
});

describe('resolveReferrerUserId', () => {
  it('organic root when no candidate', () => {
    assert.equal(
      resolveReferrerUserId({ candidateUserId: null, viewerUserId: 'a' }),
      null
    );
  });

  it('hop stamps the passer', () => {
    assert.equal(
      resolveReferrerUserId({
        candidateUserId: 'passer',
        viewerUserId: 'viewer',
      }),
      'passer'
    );
  });

  it('blocks self-referral', () => {
    assert.equal(
      resolveReferrerUserId({
        candidateUserId: 'same',
        viewerUserId: 'same',
      }),
      null
    );
  });
});

describe('stampReferredByOnFirstLog (immutability)', () => {
  it('applies candidate only on first log', () => {
    assert.equal(
      stampReferredByOnFirstLog({
        existingReferredBy: null,
        isFirstLog: true,
        candidateUserId: 'passer',
        viewerUserId: 'viewer',
      }),
      'passer'
    );
  });

  it('never overwrites an existing referrer', () => {
    assert.equal(
      stampReferredByOnFirstLog({
        existingReferredBy: 'original',
        isFirstLog: false,
        candidateUserId: 'someone-else',
        viewerUserId: 'viewer',
      }),
      'original'
    );
  });

  it('keeps organic null on repeat with a new via', () => {
    assert.equal(
      stampReferredByOnFirstLog({
        existingReferredBy: null,
        isFirstLog: false,
        candidateUserId: 'late-passer',
        viewerUserId: 'viewer',
      }),
      null
    );
  });
});
