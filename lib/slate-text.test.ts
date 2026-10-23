import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePrompt, normalizeTitle, promptLength } from './slate-text';

describe('slate prompts', () => {
  it('collapses whitespace and trims', () => {
    assert.equal(
      normalizePrompt('  A quiet   trial on the dunes before sunrise.  '),
      'A quiet trial on the dunes before sunrise.'
    );
    assert.equal(normalizeTitle('  Kitty   Hawk  '), 'Kitty Hawk');
  });

  it('rejects an empty prompt', () => {
    assert.equal(normalizePrompt('   '), null);
    assert.equal(normalizeTitle('   '), null);
  });

  it('accepts 40 characters and rejects 39', () => {
    assert.equal(normalizePrompt('a'.repeat(40))?.length, 40);
    assert.equal(normalizePrompt('a'.repeat(39)), null);
  });

  it('accepts 500 characters and rejects 501', () => {
    assert.equal(normalizePrompt('a'.repeat(500))?.length, 500);
    assert.equal(normalizePrompt('a'.repeat(501)), null);
    assert.equal(promptLength('a'.repeat(500)), 500);
  });

  it('accepts a 50 character title and rejects 51', () => {
    assert.equal(normalizeTitle('a'.repeat(50))?.length, 50);
    assert.equal(normalizeTitle('a'.repeat(51)), null);
  });
});
