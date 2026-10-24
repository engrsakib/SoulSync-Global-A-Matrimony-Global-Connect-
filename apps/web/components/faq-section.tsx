'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { Card } from '@soulsync/ui/card';
import { cn } from '@soulsync/ui/lib/utils';

const FAQ_ITEMS = [
  {
    id: 'what-is-soulsync',
    question: 'What is SoulSync Global and how does it work?',
    answer:
      'SoulSync Global is a faith-aware matrimony marketplace. You create a biodata profile within a community, browse discoverable listings that match your criteria, and express interest when you find someone suitable. Consent, visibility rules, and guardian workflows are built in so next steps stay respectful and community-led.',
  },
  {
    id: 'who-is-it-for',
    question: 'Who is this platform for?',
    answer:
      'Adults who are serious about marriage and want to search within their faith tradition and community guidelines—including those who are never married, divorced, or widowed. Each tenant sets supported traditions and policies; you join the community that fits your background and goals.',
  },
  {
    id: 'cost',
    question: 'How much does it cost to create and use a biodata profile?',
    answer:
      'Creating and submitting a biodata profile is free. Optional paid features—such as additional connection slots or premium matchmaking—may be offered by specific communities or in future releases. Any fees will always be shown clearly before you choose to pay.',
  },
  {
    id: 'verification',
    question: 'How do you verify biodata information and identity?',
    answer:
      'Before a profile becomes discoverable, community moderators review submissions against tenant rules. That can include checking details with guardians or reference contacts where required. Verification reduces misuse but cannot guarantee every field; always use judgment and involve family in important decisions.',
  },
  {
    id: 'connect',
    question: 'How do I connect if I find a preferred profile?',
    answer:
      'When you express interest and it is accepted, SoulSync guides you through the approved connection flow—often sharing guardian or family contact details rather than opening unsupervised direct messaging by default. From there, families can arrange further discussion according to your community’s customs.',
  },
] as const;

function FaqBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute top-[8%] -right-[8%] h-[min(360px,50vw)] w-[min(360px,50vw)] rounded-full bg-violet-200/40 blur-3xl dark:bg-violet-900/20" />
      <div className="absolute bottom-[10%] -left-[6%] h-[min(320px,45vw)] w-[min(320px,45vw)] rounded-full bg-[var(--color-brand-500)]/15 blur-3xl" />
    </div>
  );
}

function FaqHeaderBadge() {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className="h-px w-12 bg-gradient-to-r from-transparent to-[var(--color-brand-500)]/50 sm:w-16" />
      <span className="rounded-full border border-[var(--color-brand-500)]/35 bg-white/80 px-4 py-1 text-xs font-semibold tracking-wider text-[var(--color-brand-600)] uppercase dark:bg-[var(--background)]/80">
        FAQ
      </span>
      <span className="h-px w-12 bg-gradient-to-l from-transparent to-[var(--color-brand-500)]/50 sm:w-16" />
    </div>
  );
}

export function FaqSection() {
  const [openId, setOpenId] = React.useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <section
      id="faq"
      className="relative scroll-mt-20 overflow-hidden border-t border-[var(--border)] bg-[var(--muted)]/40 py-12 md:py-16"
    >
      <FaqBackground />

      <div className="relative z-10 mx-auto w-full max-w-none space-y-8 px-4 sm:px-6 md:px-8 lg:w-[80%] lg:max-w-[80rem] lg:px-6">
        <header className="mx-auto max-w-2xl space-y-3 text-center">
          <FaqHeaderBadge />
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            <span className="bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-brand-800)] bg-clip-text text-transparent">
              Your questions, our answers
            </span>
          </h2>
          <p className="text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
            Clear answers about biodata, communities, and how SoulSync Global works.
          </p>
        </header>

        <Card className="overflow-hidden border-[var(--border)] shadow-sm">
          <ul className="divide-y divide-[var(--border)]">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openId === item.id;
              const panelId = `faq-panel-${item.id}`;
              const triggerId = `faq-trigger-${item.id}`;

              return (
                <li key={item.id}>
                  <h3 className="m-0">
                    <button
                      type="button"
                      id={triggerId}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => toggle(item.id)}
                      className={cn(
                        'flex min-h-11 w-full items-start gap-3 px-5 py-4 text-left transition-colors md:px-8 md:py-5',
                        'hover:bg-[var(--muted)]/30 focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none focus-visible:ring-inset',
                      )}
                    >
                      <span className="shrink-0 pt-0.5 text-sm font-bold text-[var(--color-brand-600)] tabular-nums sm:text-base">
                        {index + 1}.
                      </span>
                      <span className="min-w-0 flex-1 text-sm leading-snug font-semibold text-[var(--foreground)] sm:text-base">
                        {item.question}
                      </span>
                      <ChevronDown
                        className={cn(
                          'mt-0.5 h-5 w-5 shrink-0 text-[var(--muted-foreground)] transition-transform duration-200',
                          isOpen && 'rotate-180',
                        )}
                        aria-hidden
                      />
                    </button>
                  </h3>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={triggerId}
                    hidden={!isOpen}
                    className={cn(!isOpen && 'hidden')}
                  >
                    <p className="border-t border-transparent px-5 pr-12 pb-5 pl-10 text-sm leading-relaxed text-[var(--muted-foreground)] md:px-8 md:pb-6 md:pl-[3.25rem] md:text-base">
                      {item.answer}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </section>
  );
}
