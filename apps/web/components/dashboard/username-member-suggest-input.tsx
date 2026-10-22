'use client';

import * as React from 'react';
import type { TenantMemberUsernameSearchDto } from '@soulsync/shared-types/biodata-editor-grant';
import { Avatar, AvatarFallback, AvatarImage } from '@soulsync/ui/avatar';
import { cn } from '@soulsync/ui/lib/utils';
import { searchTenantMembersByUsername } from '@/lib/biodata-editor-grant-api';
import { formatMemberDisplayName } from '@/lib/format-member-display-name';

type UsernameMemberSuggestInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
};

export function UsernameMemberSuggestInput({
  value,
  onChange,
  placeholder = 'Username',
  className,
  id,
  disabled,
}: UsernameMemberSuggestInputProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [suggestions, setSuggestions] = React.useState<TenantMemberUsernameSearchDto[]>([]);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeMenu = React.useCallback(() => {
    setMenuOpen(false);
    setSuggestions([]);
    setActiveIndex(0);
  }, []);

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const runSearch = React.useCallback(
    (query: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      const trimmed = query.trim().replace(/^@+/, '');
      if (trimmed.length < 1) {
        closeMenu();
        return;
      }
      debounceRef.current = setTimeout(() => {
        void searchTenantMembersByUsername(trimmed)
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
    [closeMenu],
  );

  const pickMember = (member: TenantMemberUsernameSearchDto) => {
    onChange(member.username);
    closeMenu();
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        className={cn(
          'flex h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 text-sm',
          className,
        )}
        onChange={(event) => {
          onChange(event.target.value);
          runSearch(event.target.value);
        }}
        onKeyDown={(event) => {
          if (!menuOpen || suggestions.length === 0) {
            return;
          }
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((i) => (i + 1) % suggestions.length);
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
          } else if (event.key === 'Enter') {
            event.preventDefault();
            const pick = suggestions[activeIndex];
            if (pick) {
              pickMember(pick);
            }
          } else if (event.key === 'Escape') {
            closeMenu();
          }
        }}
        onBlur={() => {
          window.setTimeout(closeMenu, 150);
        }}
        onFocus={() => {
          runSearch(value);
        }}
      />
      {menuOpen ? (
        <ul
          className="absolute top-full z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-[var(--border)] bg-[var(--background)] py-1 shadow-lg"
          role="listbox"
        >
          {suggestions.map((member, index) => {
            const readableName = formatMemberDisplayName(member.displayName, member.username);
            return (
              <li key={member.userId} role="option" aria-selected={index === activeIndex}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--muted)]',
                    index === activeIndex && 'bg-[var(--muted)]',
                  )}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    pickMember(member);
                  }}
                >
                  <Avatar className="h-7 w-7 shrink-0">
                    {member.avatarUrl ? (
                      <AvatarImage src={member.avatarUrl} alt="" />
                    ) : (
                      <AvatarFallback className="text-xs">
                        {member.username.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    {readableName ? (
                      <>
                        <span className="font-medium text-[var(--foreground)]">{readableName}</span>
                        <span className="text-muted-foreground ml-2 text-xs">
                          @{member.username}
                        </span>
                      </>
                    ) : (
                      <span className="font-medium text-[var(--foreground)]">
                        @{member.username}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
