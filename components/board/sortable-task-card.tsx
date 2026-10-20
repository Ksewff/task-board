'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { KeyboardEvent } from 'react';
import { PRIORITY_META } from '@/lib/constants';
import { cn } from '@/lib/cn';
import type { Task } from '@/lib/types';
import { TaskCard } from './task-card';

interface SortableTaskCardProps {
  task: Task;
  onSelect: (task: Task) => void;
}

export function SortableTaskCard({ task, onSelect }: SortableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', status: task.status },
  });

  // dnd-kit 的 KeyboardSensor 也挂在 onKeyDown 上，需要先转发再补 Enter 编辑
  const dndOnKeyDown = listeners?.onKeyDown as
    | ((event: KeyboardEvent<HTMLLIElement>) => void)
    | undefined;

  return (
    <li
      ref={setNodeRef}
      // isDragging 时不应用 transform：源位置保留一张半透明占位卡，位移交给 DragOverlay
      style={{ transform: isDragging ? undefined : CSS.Transform.toString(transform), transition }}
      aria-label={`${task.title}，优先级${PRIORITY_META[task.priority].label}。回车编辑，空格拖动`}
      className={cn(
        'touch-none select-none rounded-xl outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-indigo-400/70',
        isDragging && 'opacity-40',
      )}
      {...attributes}
      {...listeners}
      onKeyDown={(event) => {
        dndOnKeyDown?.(event);
        if (event.defaultPrevented) return;

        if (event.key === 'Enter') {
          event.preventDefault();
          onSelect(task);
        }
      }}
      onClick={() => onSelect(task)}
    >
      <TaskCard task={task} />
    </li>
  );
}
