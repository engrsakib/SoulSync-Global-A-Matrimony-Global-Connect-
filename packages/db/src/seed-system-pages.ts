import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { createPrismaClient } from './index';

type PrismaClient = ReturnType<typeof createPrismaClient>;
import {
  SYSTEM_PAGE_SEED_CONTENT_UPDATED_AT,
  type SystemPageSidebarCardDto,
} from '@soulsync/shared-types/system-page';

const DATA_DIR = resolve(__dirname, '../data/system-pages');

function readMarkdown(filename: string): string {
  return readFileSync(resolve(DATA_DIR, filename), 'utf8');
}

type SeedPage = {
  slug: string;
  title: string;
  markdownFile: string;
  sortOrder: number;
  sidebar: SystemPageSidebarCardDto[];
};

const PAGES: SeedPage[] = [
  {
    slug: 'terms',
    title: 'Terms & Conditions',
    markdownFile: 'terms.md',
    sortOrder: 1,
    sidebar: [
      {
        id: 'terms-eligibility',
        tone: 'medium',
        category: 'Review',
        title: 'Eligibility & accounts',
        body: 'Confirm you meet age and legal capacity rules before registering.',
        iconKey: 'user-check',
      },
      {
        id: 'terms-conduct',
        tone: 'high',
        category: 'Important',
        title: 'Acceptable use',
        body: 'Misrepresentation, scraping, and bypassing visibility controls are prohibited.',
        iconKey: 'shield-alert',
      },
      {
        id: 'terms-liability',
        tone: 'low',
        category: 'Notice',
        title: 'Platform role',
        body: 'SoulSync facilitates discovery; marriage outcomes are between members.',
        iconKey: 'scale',
      },
    ],
  },
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    markdownFile: 'privacy-policy.md',
    sortOrder: 2,
    sidebar: [
      {
        id: 'privacy-sensitive',
        tone: 'high',
        category: 'Sensitive data',
        title: 'Encrypted biodata fields',
        body: 'Guardian, health, and registry contact fields use extra application-layer protection.',
        iconKey: 'lock',
      },
      {
        id: 'privacy-sharing',
        tone: 'medium',
        category: 'Sharing',
        title: 'No data sales',
        body: 'We share only to operate the service or with your explicit consent flows.',
        iconKey: 'share-2',
      },
      {
        id: 'privacy-rights',
        tone: 'low',
        category: 'Your rights',
        title: 'Access & deletion',
        body: 'Contact us to exercise access, correction, or deletion where applicable.',
        iconKey: 'file-text',
      },
    ],
  },
  {
    slug: 'safety',
    title: 'Safety on SoulSync',
    markdownFile: 'safety.md',
    sortOrder: 3,
    sidebar: [
      {
        id: 'safety-e2e-chat',
        tone: 'high',
        category: 'Private chat',
        title: 'End-to-end encryption',
        body: 'Message content in member chat is encrypted on your device; only participants can read it.',
        iconKey: 'lock',
      },
      {
        id: 'safety-biodata',
        tone: 'high',
        category: 'Biodata',
        title: 'Encrypted sensitive fields',
        body: 'Selected PII and registry contact data are protected at the API layer before storage.',
        iconKey: 'key-round',
      },
      {
        id: 'safety-visibility',
        tone: 'medium',
        category: 'Controls',
        title: 'Visibility & grants',
        body: 'Section visibility, editor grants, and access requests gate who sees your biodata.',
        iconKey: 'eye',
      },
      {
        id: 'safety-report',
        tone: 'low',
        category: 'Community',
        title: 'Report & block',
        body: 'Use in-app tools to flag abuse; staff review reports without reading E2E message bodies.',
        iconKey: 'shield-alert',
      },
    ],
  },
  {
    slug: 'return-refund',
    title: 'Return & Refund Policy',
    markdownFile: 'return-refund.md',
    sortOrder: 4,
    sidebar: [
      {
        id: 'refund-credits',
        tone: 'medium',
        category: 'Credits',
        title: 'Wallet purchases',
        body: 'Credits are usually non-refundable once added, unless law or checkout terms say otherwise.',
        iconKey: 'file-text',
      },
      {
        id: 'refund-errors',
        tone: 'high',
        category: 'Billing',
        title: 'Erroneous charges',
        body: 'Report duplicate or wrong charges within 30 days for review and eligible refunds.',
        iconKey: 'scale',
      },
      {
        id: 'refund-contact',
        tone: 'low',
        category: 'Support',
        title: 'Contact first',
        body: 'Email hello@soulsync.global before filing a chargeback so we can resolve billing quickly.',
        iconKey: 'share-2',
      },
    ],
  },
];

export async function seedSystemPages(prisma: PrismaClient): Promise<void> {
  for (const page of PAGES) {
    const markdown = readMarkdown(page.markdownFile);
    await prisma.systemPage.upsert({
      where: { slug: page.slug },
      update: {
        title: page.title,
        markdown,
        sortOrder: page.sortOrder,
        sidebar: page.sidebar,
        updatedAt: new Date(SYSTEM_PAGE_SEED_CONTENT_UPDATED_AT),
      },
      create: {
        slug: page.slug,
        title: page.title,
        markdown,
        sortOrder: page.sortOrder,
        sidebar: page.sidebar,
        updatedAt: new Date(SYSTEM_PAGE_SEED_CONTENT_UPDATED_AT),
      },
    });
  }
  console.log(`Seeded ${PAGES.length} system pages (terms, privacy-policy, safety, return-refund)`);
}
