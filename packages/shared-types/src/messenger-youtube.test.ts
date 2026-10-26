import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseYouTubeVideoId, youTubeEmbedSrc } from './messenger-youtube';

describe('parseYouTubeVideoId', () => {
  it('parses watch URLs', () => {
    assert.equal(parseYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  });

  it('parses youtu.be', () => {
    assert.equal(parseYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  });

  it('rejects invalid ids', () => {
    assert.equal(parseYouTubeVideoId('https://youtu.be/short'), null);
  });
});

describe('youTubeEmbedSrc', () => {
  it('builds nocookie embed', () => {
    assert.equal(
      youTubeEmbedSrc('dQw4w9WgXcQ'),
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    );
  });
});
