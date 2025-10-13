
'use client';

import { Badge } from '@/components/ui/badge';
import type { Connection } from '@/lib/types';

interface StageBadgeProps {
  stage: Connection['stage'];
}

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';

export function StageBadge({ stage }: StageBadgeProps) {
  if (stage === null || stage === undefined) {
    return null;
  }

  const stageVariant: { [key in number]: BadgeVariant } = {
    0: 'secondary',
    1: 'default',
    2: 'outline',
    3: 'default', // Using default again for variety, can be changed
    4: 'destructive',
  };

  const stageLabel: { [key in number]: string } = {
    0: 'Initial',
    1: 'Stage 1',
    2: 'Stage 2',
    3: 'Stage 3',
    4: 'Stage 4',
  };


  const variant = stageVariant[stage] || 'default';
  const label = stageLabel[stage] || `Stage ${stage}`;

  return (
    <Badge variant={variant} className="capitalize">
      {label}
    </Badge>
  );
}

    