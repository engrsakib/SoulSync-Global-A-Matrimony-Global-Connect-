'use client';

import * as React from 'react';
import Link from 'next/link';
import { memberRoutes } from '@/lib/member-routes';
import { formatCommunityAuthorUsername } from '@/lib/communities-format';

const MENTION_TOKEN_RE = /@[a-zA-Z0-9_]{2,32}/g;

type Segment = { kind: 'text'; value: string } | { kind: 'mention'; username: string; raw: string };

function splitMentionSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(MENTION_TOKEN_RE)) {
    const index = match.index ?? 0;
    const raw = match[0];
    const username = raw.slice(1).toLowerCase();
    if (index > lastIndex) {
      segments.push({ kind: 'text', value: text.slice(lastIndex, index) });
    }
    segments.push({ kind: 'mention', username, raw });
    lastIndex = index + raw.length;
  }
  if (lastIndex < text.length) {
    segments.push({ kind: 'text', value: text.slice(lastIndex) });
  }
  return segments.length > 0 ? segments : [{ kind: 'text', value: text }];
}

type MentionRichTextProps = {
  text: string;
  communitySlug: string;
  className?: string;
};

export function MentionRichText({ text, communitySlug, className }: MentionRichTextProps) {
  const segments = React.useMemo(() => splitMentionSegments(text), [text]);

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.kind === 'text') {
          return <React.Fragment key={`t-${index}`}>{segment.value}</React.Fragment>;
        }
        const label = formatCommunityAuthorUsername(segment.username);
        return (
          <Link
            key={`m-${index}`}
            href={memberRoutes.communityMember(communitySlug, segment.username)}
            className="font-medium text-[var(--primary)] hover:underline"
          >
            {label.startsWith('@') ? label : `@${label}`}
          </Link>
        );
      })}
    </span>
  );
}
