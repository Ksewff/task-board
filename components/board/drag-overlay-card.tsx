import type { Task } from '@/lib/types';
import { TaskCard } from './task-card';

interface DragOverlayCardProps {
  task: Task;
}

/**
 * 跟随鼠标的浮层卡片。
 * 旋转/缩放只作用在这一层（由 .animate-card-lift 完成），
 * 绝不和 dnd-kit 写在节点上的 translate transform 混用，否则松手会跳位。
 */
export function DragOverlayCard({ task }: DragOverlayCardProps) {
  return (
    <div className="animate-card-lift cursor-grabbing">
      <TaskCard
        task={task}
        className="border-indigo-400/60 bg-slate-800 shadow-2xl shadow-indigo-950/70 ring-1 ring-indigo-400/30"
      />
    </div>
  );
}
