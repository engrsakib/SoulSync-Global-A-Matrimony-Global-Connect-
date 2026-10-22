'use client';

import * as React from 'react';
import {
  extractBiodataUsernamesFromText,
  splitPostBodyForRender,
} from '@soulsync/shared-types/biodata-view';
import { BiodataLinkPreviewCard } from './biodata-link-preview-card';

const GENERIC_URL_RE = /https?:\/\/[^\s]+/g;

function linkifyTextSegment(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let linkIndex = 0;

  for (const match of text.matchAll(GENERIC_URL_RE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index));
    }
    const url = match[0];
    if (!/\/biodata\//i.test(url)) {
      nodes.push(
        <a
          key={`${keyPrefix}-link-${linkIndex}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--primary)] underline underline-offset-2"
        >
          {url}
        </a>,
      );
      linkIndex += 1;
    }
    lastIndex = index + url.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

export function CommunityPostBody({ bodyText }: { bodyText: string }) {
  const segments = React.useMemo(() => splitPostBodyForRender(bodyText), [bodyText]);
  const biodataUsernames = React.useMemo(
    () => extractBiodataUsernamesFromText(bodyText),
    [bodyText],
  );

  const hasText = segments.some((s) => s.kind === 'text' && s.value.trim().length > 0);

  if (!bodyText.trim() && biodataUsernames.length === 0) {
    return null;
  }

  return (
    <div className="space-y-0">
      {hasText ? (
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {segments.map((segment, index) => {
            if (segment.kind === 'biodata_url') {
              return null;
            }
            if (!segment.value) {
              return null;
            }
            return (
              <React.Fragment key={`text-${index}`}>
                {linkifyTextSegment(segment.value, `seg-${index}`)}
              </React.Fragment>
            );
          })}
        </p>
      ) : null}

      {biodataUsernames.map((username) => (
        <BiodataLinkPreviewCard key={username} username={username} />
      ))}
    </div>
  );
}
