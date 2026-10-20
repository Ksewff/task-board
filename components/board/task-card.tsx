import { formatTaskDate } from '@/lib/task-utils';
import { cn } from '@/lib/cn';
import type { Task } from '@/lib/types';
import { PriorityBadge } from '@/components/ui/priority-badge';

interface TaskCardProps {
  task: Task;
  className?: string;
}

/** 纯展示卡片：列内卡片与拖拽浮层复用同一份 */
export function TaskCard({ task, className }: TaskCardProps) {
  return (
    <article
      className={cn(
        'group/card rounded-xl border border-slate-700/70 bg-slate-800 p-3.5 shadow-lg shadow-black/20 transition-colors duration-150',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-slate-100">{task.title}</h3>
        <PriorityBadge priority={task.priority} />
      </div>

      {task.description ? (
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-400">{task.description}</p>
      ) : null}

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
        <span>创建于 {formatTaskDate(task.createdAt)}</span>
        <span className="opacity-0 transition-opacity duration-150 group-hover/card:opacity-100">点击编辑</span>
      </div>
    </article>
  );
}
