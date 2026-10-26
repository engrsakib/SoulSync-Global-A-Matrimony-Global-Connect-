import type { LucideIcon } from 'lucide-react';
import {
  Eye,
  FileText,
  Globe,
  KeyRound,
  Lock,
  Scale,
  Share2,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  'user-check': UserCheck,
  'shield-alert': ShieldAlert,
  scale: Scale,
  lock: Lock,
  'share-2': Share2,
  'file-text': FileText,
  'key-round': KeyRound,
  eye: Eye,
  globe: Globe,
};

export function systemSidebarIcon(iconKey?: string): LucideIcon | null {
  if (!iconKey) {
    return null;
  }
  return ICONS[iconKey] ?? null;
}
