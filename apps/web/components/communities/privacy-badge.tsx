import { Globe, Lock } from 'lucide-react';
import { Badge } from '@soulsync/ui/badge';
import type { CommunityPrivacyDto } from '@soulsync/shared-types/communities';

export function PrivacyBadge({ privacy }: { privacy: CommunityPrivacyDto }) {
  const isPrivate = privacy === 'PRIVATE';
  return (
    <Badge variant="outline" className="gap-1 font-normal">
      {isPrivate ? <Lock className="h-3 w-3" aria-hidden /> : <Globe className="h-3 w-3" aria-hidden />}
      {isPrivate ? 'Private' : 'Public'}
    </Badge>
  );
}
