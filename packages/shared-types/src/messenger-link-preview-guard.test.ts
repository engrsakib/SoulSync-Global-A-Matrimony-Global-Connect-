import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assertSafeLinkPreviewUrl } from './messenger-link-preview-guard';

describe('assertSafeLinkPreviewUrl', () => {
  it('allows public https URLs', () => {
    const url = assertSafeLinkPreviewUrl('https://example.com/page');
    assert.ok(url);
    assert.equal(url?.hostname, 'example.com');
  });

  it('blocks localhost', () => {
    assert.equal(assertSafeLinkPreviewUrl('http://127.0.0.1/admin'), null);
  });
});
