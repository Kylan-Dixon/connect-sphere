
'use client';

import { Badge } from '@/components/ui/badge';
import type { Connection } from '@/lib/types';

interface StageBadgeProps {
  stage: Connection['stage'];
}

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';

export function StageBadge({ stage }: StageBadgeProps) {
  if (!stage) {
    return null;
  }

  const stageVariant: { [key in number]: BadgeVariant } = {
    1: 'default',
    2: 'secondary',
    3: 'outline',
    4: 'destructive',
  };

  const variant = stageVariant[stage] || 'default';

  return (
    <Badge variant={variant} className="capitalize">
      Stage {stage}
    </Badge>
  );
}
