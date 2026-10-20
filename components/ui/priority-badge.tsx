import { PRIORITY_META } from '@/lib/constants';
import { cn } from '@/lib/cn';
import type { Priority } from '@/lib/types';

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const meta = PRIORITY_META[priority];

  return (
    <span
      title={`优先级：${meta.label}`}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[11px] font-medium',
        meta.badgeClassName,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dotClassName)} aria-hidden />
      {meta.label}
    </span>
  );
}
