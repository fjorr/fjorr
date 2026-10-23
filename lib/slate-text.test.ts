import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePrompt, promptLength } from './slate-text';

describe('slate prompts', () => {
  it('collapses whitespace and trims', () => {
    assert.equal(normalizePrompt('  A quiet   trial  '), 'A quiet trial');
  });

  it('rejects an empty prompt', () => {
    assert.equal(normalizePrompt('   '), null);
  });

  it('accepts 280 characters and rejects 281', () => {
    assert.equal(normalizePrompt('a'.repeat(280))?.length, 280);
    assert.equal(normalizePrompt('a'.repeat(281)), null);
    assert.equal(promptLength('a'.repeat(280)), 280);
  });
});
