import { Target, Compass } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@soulsync/ui/card';
import type { AboutPageTextBlockDto } from '@soulsync/shared-types/about-page';
import { PublicSectionHeader } from '@/components/public/public-section-header';
import { PublicSectionShell } from '@/components/public/public-section-shell';

type AboutGoalMissionSectionProps = {
  goal: AboutPageTextBlockDto;
  mission: AboutPageTextBlockDto;
};

function TextBlockCard({
  block,
  icon: Icon,
}: {
  block: AboutPageTextBlockDto;
  icon: typeof Target;
}) {
  return (
    <Card className="h-full border-[var(--border)] bg-[var(--card)] shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-brand-500)]/20 to-[var(--color-brand-700)]/10 text-[var(--color-brand-700)] dark:text-[var(--color-brand-300)]">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <CardTitle className="text-xl">{block.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="leading-relaxed text-[var(--muted-foreground)]">{block.body}</p>
      </CardContent>
    </Card>
  );
}

export function AboutGoalMissionSection({ goal, mission }: AboutGoalMissionSectionProps) {
  return (
    <PublicSectionShell>
      <div className="space-y-10">
        <PublicSectionHeader
          badge="Purpose"
          title="What drives SoulSync Global"
          description="Our goal and mission keep product decisions aligned with members, guardians, and community leaders."
        />
        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          <TextBlockCard block={goal} icon={Target} />
          <TextBlockCard block={mission} icon={Compass} />
        </div>
      </div>
    </PublicSectionShell>
  );
}
