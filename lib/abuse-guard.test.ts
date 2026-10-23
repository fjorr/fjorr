import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  allowRate,
  clientIp,
  firstInWindow,
  isAllowedSiteOrigin,
  isDisposableEmail,
  newsletterIdentity,
  resetAbuseGuards,
} from './abuse-guard';
import mediaImageLoader from './image-loader';

describe('abuse guard', () => {
  beforeEach(() => {
    resetAbuseGuards();
  });

  it('reads the platform client address before a forwarded list', () => {
    assert.equal(
      clientIp((name) =>
        name === 'x-real-ip'
          ? '203.0.113.8'
          : name === 'x-forwarded-for'
            ? '198.51.100.4, 203.0.113.8'
            : null
      ),
      '203.0.113.8'
    );
  });

  it('stops once the window is full', () => {
    assert.equal(allowRate('checkout:test', 2, 60_000), true);
    assert.equal(allowRate('checkout:test', 2, 60_000), true);
    assert.equal(allowRate('checkout:test', 2, 60_000), false);
  });

  it('counts one film view per window', () => {
    assert.equal(firstInWindow('view:1:film', 60_000), true);
    assert.equal(firstInWindow('view:1:film', 60_000), false);
  });

  it('allows the house and rejects a foreign page', () => {
    assert.equal(isAllowedSiteOrigin(null), true);
    assert.equal(isAllowedSiteOrigin('https://www.fjorr.com'), true);
    assert.equal(isAllowedSiteOrigin('https://staging.fjorr.com'), true);
    assert.equal(isAllowedSiteOrigin('http://localhost:3000'), true);
    assert.equal(isAllowedSiteOrigin('https://fjorr-git-staging-fjorr.vercel.app'), true);
    assert.equal(isAllowedSiteOrigin('https://evil.example'), false);
  });

  it('rejects temporary inboxes and keeps private relays', () => {
    assert.equal(isDisposableEmail('person@mailinator.com'), true);
    assert.equal(isDisposableEmail('person@mail.guerrillamail.com'), true);
    assert.equal(isDisposableEmail('person@proton.me'), false);
    assert.equal(isDisposableEmail('hide@privaterelay.appleid.com'), false);
    assert.equal(isDisposableEmail('person@duck.com'), false);
  });

  it('collapses gmail aliases onto one inbox', () => {
    assert.equal(
      newsletterIdentity('Thor.Name+fjorr@gmail.com'),
      'thorname@gmail.com'
    );
    assert.equal(
      newsletterIdentity('person+list@icloud.com'),
      'person@icloud.com'
    );
    assert.equal(
      newsletterIdentity('person+list@proton.me'),
      'person+list@proton.me'
    );
  });
});

describe('image loader', () => {
  it('passes the original file through until resizing is on', () => {
    const previous = process.env.NEXT_PUBLIC_CF_IMAGE_RESIZE;
    delete process.env.NEXT_PUBLIC_CF_IMAGE_RESIZE;
    assert.equal(
      mediaImageLoader({
        src: 'https://media.fjorr.com/films/moonshot/hero.avif',
        width: 1920,
      }),
      'https://media.fjorr.com/films/moonshot/hero.avif'
    );
    process.env.NEXT_PUBLIC_CF_IMAGE_RESIZE = 'true';
    assert.match(
      mediaImageLoader({
        src: 'https://media.fjorr.com/films/moonshot/hero.avif',
        width: 640,
      }),
      /cdn-cgi\/image\/width=640/
    );
    if (previous == null) delete process.env.NEXT_PUBLIC_CF_IMAGE_RESIZE;
    else process.env.NEXT_PUBLIC_CF_IMAGE_RESIZE = previous;
  });
});
