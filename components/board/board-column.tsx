'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { COLUMN_META, columnDroppableId } from '@/lib/constants';
import { cn } from '@/lib/cn';
import type { Status, Task } from '@/lib/types';
import { SortableTaskCard } from './sortable-task-card';

interface BoardColumnProps {
  status: Status;
  tasks: Task[];
  /** 是否有拖拽进行中（用于空列提示文案） */
  isDragging: boolean;
  /** 当前落点是否在本列（跨列时由 TaskBoard 计算） */
  isDropTarget: boolean;
  onSelect: (task: Task) => void;
}

export function BoardColumn({ status, tasks, isDragging, isDropTarget, onSelect }: BoardColumnProps) {
  const meta = COLUMN_META[status];
  const { setNodeRef } = useDroppable({
    id: columnDroppableId(status),
    data: { type: 'column', status },
  });

  return (
    <section
      className={cn(
        'flex min-h-[420px] flex-col rounded-2xl border bg-slate-900/60 transition-all duration-200',
        isDropTarget
          ? 'border-indigo-400/70 bg-indigo-500/[0.07] ring-2 ring-indigo-400/30'
          : 'border-slate-800',
      )}
    >
      <header className="flex items-center justify-between gap-2 border-b border-slate-800/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', meta.dotClassName)} aria-hidden />
          <h2 className={cn('text-xs font-semibold uppercase tracking-wider', meta.titleClassName)}>
            {meta.title}
          </h2>
          <span className="text-[11px] text-slate-500">{meta.description}</span>
        </div>
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium tabular-nums text-slate-400">
          {tasks.length}
        </span>
      </header>

      <div
        ref={setNodeRef}
        className="board-scroll flex min-h-[140px] flex-1 flex-col gap-2.5 overflow-y-auto p-3"
      >
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-2.5">
            {tasks.map((task) => (
              <SortableTaskCard key={task.id} task={task} onSelect={onSelect} />
            ))}
          </ul>
        </SortableContext>

        {tasks.length === 0 ? (
          <div
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-10 text-center transition-colors duration-200',
              isDropTarget
                ? 'border-indigo-400/60 bg-indigo-500/10 text-indigo-200'
                : 'border-slate-700/70 text-slate-500',
            )}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <p className="text-xs">{isDragging ? '松手放到这里' : '暂无任务，拖一张卡片过来'}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
