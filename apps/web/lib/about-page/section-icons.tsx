import type { LucideIcon } from 'lucide-react';
import {
  AlarmClock,
  BookOpen,
  Building2,
  CalendarCheck,
  Eye,
  HeartHandshake,
  Hourglass,
  Lock,
  Palette,
  Scale,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Users,
  UsersRound,
} from 'lucide-react';

const CORE_VALUE_ICONS: Record<string, LucideIcon> = {
  dignity: HeartHandshake,
  consent: Eye,
  'faith-aware': BookOpen,
  family: UsersRound,
  integrity: Scale,
  privacy: Lock,
};

const WHAT_WE_DO_ICONS: Record<string, LucideIcon> = {
  biodata: Search,
  communities: Building2,
  guardian: Users,
  marriage: CalendarCheck,
};

export function coreValueIcon(id: string): LucideIcon {
  return CORE_VALUE_ICONS[id] ?? Sparkles;
}

export function whatWeDoIcon(id: string): LucideIcon {
  return WHAT_WE_DO_ICONS[id] ?? Shield;
}

const MILESTONE_ICONS: Record<string, LucideIcon> = {
  launch: AlarmClock,
  tenants: Building2,
  encryption: ShieldCheck,
  'marriage-features': Hourglass,
  experience: Palette,
};

export function milestoneIcon(id: string): LucideIcon {
  return MILESTONE_ICONS[id] ?? Sparkles;
}
