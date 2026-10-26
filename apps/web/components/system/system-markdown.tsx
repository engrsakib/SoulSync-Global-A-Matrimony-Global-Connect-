'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@soulsync/ui/lib/utils';

type SystemMarkdownProps = {
  markdown: string;
  className?: string;
};

export function SystemMarkdown({ markdown, className }: SystemMarkdownProps) {
  return (
    <div
      className={cn(
        'system-markdown space-y-4 text-base leading-relaxed text-[var(--muted-foreground)]',
        '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-[var(--foreground)] sm:[&_h1]:text-3xl',
        '[&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[var(--foreground)]',
        '[&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-[var(--foreground)]',
        '[&_p]:text-[var(--muted-foreground)] [&_li]:text-[var(--muted-foreground)]',
        '[&_strong]:font-semibold [&_strong]:text-[var(--foreground)]',
        '[&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5',
        '[&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5',
        '[&_a]:font-medium [&_a]:text-[var(--color-brand-500)] [&_a]:underline-offset-2 hover:[&_a]:underline',
        '[&_code]:rounded [&_code]:bg-[var(--muted)]/80 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:text-[var(--foreground)]',
        '[&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-[var(--border)] [&_th]:bg-[var(--muted)]/50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-sm [&_th]:font-semibold [&_th]:text-[var(--foreground)]',
        '[&_td]:border [&_td]:border-[var(--border)] [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm [&_td]:text-[var(--muted-foreground)]',
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}
