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
        'system-markdown space-y-4 text-base leading-relaxed text-slate-300',
        '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-[var(--foreground)] sm:[&_h1]:text-3xl',
        '[&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[var(--foreground)]',
        '[&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-[var(--foreground)]',
        '[&_p]:text-slate-300 [&_strong]:font-semibold [&_strong]:text-slate-200',
        '[&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5',
        '[&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5',
        '[&_a]:font-medium [&_a]:text-[var(--color-brand-400)] [&_a]:underline-offset-2 hover:[&_a]:underline',
        '[&_code]:rounded [&_code]:bg-[var(--muted)]/80 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:text-slate-200',
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}
