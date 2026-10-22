'use client';

import * as React from 'react';
import Image from 'next/image';
import { Button } from '@soulsync/ui/button';
import { Avatar, AvatarFallback } from '@soulsync/ui/avatar';
import { cn } from '@soulsync/ui/lib/utils';
import { useCurrentUser } from '@/hooks/use-current-user';
import { MentionComposer } from './mention-composer';

type CommentComposerProps = {
  slug: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  posting?: boolean;
  placeholder?: string;
  compact?: boolean;
  className?: string;
};

export function CommentComposer({
  slug,
  value,
  onChange,
  onSubmit,
  posting,
  placeholder = 'Write a comment…',
  compact,
  className,
}: CommentComposerProps) {
  const { user } = useCurrentUser();
  const initials = (user?.username ?? user?.firstName ?? 'ME').slice(0, 2).toUpperCase();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!value.trim() || posting) {
      return;
    }
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className={cn('flex items-start gap-2', className)}>
      <Avatar className={cn('shrink-0', compact ? 'h-8 w-8' : 'h-9 w-9')}>
        {user?.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt=""
            width={36}
            height={36}
            className="h-full w-full object-cover"
          />
        ) : (
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        )}
      </Avatar>
      <div className="min-w-0 flex-1 space-y-2">
        <MentionComposer
          slug={slug}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={compact ? 2 : 2}
          inputClassName={cn(
            'min-h-[44px] rounded-2xl text-base leading-snug',
            compact && 'min-h-[40px] text-sm',
          )}
        />
        {value.trim() ? (
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={posting}>
              {posting ? 'Posting…' : 'Post'}
            </Button>
          </div>
        ) : null}
      </div>
    </form>
  );
}
