'use client';

import * as React from 'react';
import type { CommunityMemberDto } from '@soulsync/shared-types/communities';
import { Avatar, AvatarFallback, AvatarImage } from '@soulsync/ui/avatar';
import { cn } from '@soulsync/ui/lib/utils';
import { searchCommunityMembers } from '@/lib/communities-client';
import { formatCommunityAuthorUsername } from '@/lib/communities-format';

type MentionComposerProps = {
  slug: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  rows?: number;
  disabled?: boolean;
};

type ActiveMention = { query: string; replaceStart: number; caret: number };

function detectActiveMention(text: string, caret: number): ActiveMention | null {
  const before = text.slice(0, caret);
  const match = /(?:^|[\s([{"'])@([a-zA-Z0-9_]*)$/.exec(before);
  if (!match) {
    return null;
  }
  const query = match[1] ?? '';
  const replaceStart = before.length - query.length - 1;
  return { query, replaceStart, caret };
}

export function MentionComposer({
  slug,
  value,
  onChange,
  placeholder,
  className,
  inputClassName,
  rows = 2,
  disabled,
}: MentionComposerProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [suggestions, setSuggestions] = React.useState<CommunityMemberDto[]>([]);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const closeMenu = React.useCallback(() => {
    setMenuOpen(false);
    setSuggestions([]);
    setActiveIndex(0);
  }, []);

  const runMentionSearch = React.useCallback(
    (mention: ActiveMention | null) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (!mention) {
        closeMenu();
        return;
      }
      debounceRef.current = setTimeout(() => {
        void searchCommunityMembers(slug, mention.query)
          .then((rows) => {
            setSuggestions(rows);
            setMenuOpen(rows.length > 0);
            setActiveIndex(0);
          })
          .catch(() => {
            closeMenu();
          });
      }, 200);
    },
    [slug, closeMenu],
  );

  function syncMentionMenu(nextValue: string, caret: number) {
    runMentionSearch(detectActiveMention(nextValue, caret));
  }

  function insertMention(member: CommunityMemberDto) {
    const el = textareaRef.current;
    if (!el) {
      return;
    }
    const caret = el.selectionStart ?? value.length;
    const mention = detectActiveMention(value, caret);
    if (!mention || !member.username) {
      return;
    }
    const username = member.username.replace(/^@+/, '');
    const insert = `@${username} `;
    const next = value.slice(0, mention.replaceStart) + insert + value.slice(mention.caret);
    onChange(next);
    closeMenu();
    requestAnimationFrame(() => {
      const pos = mention.replaceStart + insert.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }

  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = event.target.value;
    onChange(next);
    syncMentionMenu(next, event.target.selectionStart ?? next.length);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!menuOpen || suggestions.length === 0) {
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      const pick = suggestions[activeIndex];
      if (pick) {
        insertMention(pick);
      }
    } else if (event.key === 'Escape') {
      closeMenu();
    }
  }

  return (
    <div className={cn('relative min-w-0 flex-1', className)}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          window.setTimeout(closeMenu, 150);
        }}
        onClick={(event) => {
          syncMentionMenu(value, event.currentTarget.selectionStart ?? value.length);
        }}
        rows={rows}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          'w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm',
          inputClassName,
        )}
      />
      {menuOpen ? (
        <ul
          className="absolute bottom-full z-20 mb-1 max-h-48 w-full overflow-auto rounded-lg border border-[var(--border)] bg-[var(--background)] py-1 shadow-lg"
          role="listbox"
        >
          {suggestions.map((member, index) => (
            <li key={member.userId} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--muted)]',
                  index === activeIndex && 'bg-[var(--muted)]',
                )}
                onMouseDown={(event) => {
                  event.preventDefault();
                  insertMention(member);
                }}
              >
                <Avatar className="h-7 w-7">
                  {member.avatarUrl ? (
                    <AvatarImage src={member.avatarUrl} alt="" />
                  ) : (
                    <AvatarFallback className="text-xs">
                      {(member.username ?? '?').slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span>{formatCommunityAuthorUsername(member.username)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
