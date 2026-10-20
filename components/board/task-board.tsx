'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  closestCorners,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type DropAnimation,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { TaskModal } from '@/components/task/task-modal';
import { useTasks } from '@/hooks/use-tasks';
import { COLUMN_META, STATUSES } from '@/lib/constants';
import { groupByStatus, statusOfDroppableId } from '@/lib/task-utils';
import type { Status, Task, TaskDraft } from '@/lib/types';
import { BoardColumn } from './board-column';
import { DragOverlayCard } from './drag-overlay-card';

type ModalState = { mode: 'create' } | { mode: 'edit'; id: string };

const DROP_ANIMATION: DropAnimation = {
  duration: 220,
  easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: '0.35' } },
  }),
};

export function TaskBoard() {
  const { tasks, ready, addTask, editTask, deleteTask, dropTask } = useTasks();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<Status | null>(null);
  const [activeWidth, setActiveWidth] = useState<number | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);

  // 拖拽结束后浏览器仍会派发一次 click，用一个时间窗把它挡掉，避免误开弹窗
  const lastDragEndAtRef = useRef(0);

  const columns = useMemo(() => groupByStatus(tasks), [tasks]);
  const activeTask = activeId ? (tasks.find((task) => task.id === activeId) ?? null) : null;
  const editingTask =
    modal?.mode === 'edit' ? (tasks.find((task) => task.id === modal.id) ?? null) : null;

  const sensors = useSensors(
    // 位移超过 8px 才算拖拽：否则点击卡片会被误判成拖动
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const announcements = useMemo<Announcements>(() => {
    const titleOf = (id: string) => tasks.find((task) => task.id === id)?.title ?? '任务';
    const columnOf = (id: string) => {
      const status = statusOfDroppableId(id, tasks);
      return status ? COLUMN_META[status].title : '未知列';
    };

    return {
      onDragStart({ active }) {
        return `已拾起「${titleOf(String(active.id))}」，使用方向键移动，空格放下，Esc 取消`;
      },
      onDragOver({ active, over }) {
        if (!over) return undefined;
        return `「${titleOf(String(active.id))}」移动到「${columnOf(String(over.id))}」`;
      },
      onDragEnd({ active, over }) {
        if (!over) return `「${titleOf(String(active.id))}」已取消移动`;
        return `「${titleOf(String(active.id))}」已放到「${columnOf(String(over.id))}」`;
      },
      onDragCancel({ active }) {
        return `已取消移动「${titleOf(String(active.id))}」`;
      },
    };
  }, [tasks]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    setActiveWidth(event.active.rect.current.initial?.width ?? null);
    setOverColumn(null);
  }, []);

  // 拖拽过程中只更新「落点所属列」，不修改 tasks —— 这是避免状态冲突的核心
  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const overId = event.over ? String(event.over.id) : null;
      setOverColumn(overId ? statusOfDroppableId(overId, tasks) : null);
    },
    [tasks],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      lastDragEndAtRef.current = Date.now();
      setActiveId(null);
      setOverColumn(null);
      setActiveWidth(null);

      if (!event.over) return;

      // 唯一一次提交：setState + saveTasks 在 dropTask 内部同帧完成
      dropTask(String(event.active.id), String(event.over.id));
    },
    [dropTask],
  );

  const handleDragCancel = useCallback(() => {
    lastDragEndAtRef.current = Date.now();
    setActiveId(null);
    setOverColumn(null);
    setActiveWidth(null);
  }, []);

  const handleSelect = useCallback((task: Task) => {
    if (Date.now() - lastDragEndAtRef.current < 160) return;
    setModal({ mode: 'edit', id: task.id });
  }, []);

  const handleSubmit = (draft: TaskDraft) => {
    if (modal?.mode === 'edit') {
      editTask(modal.id, draft);
    } else {
      addTask(draft);
    }
    setModal(null);
  };

  const handleDelete = () => {
    if (modal?.mode === 'edit') {
      deleteTask(modal.id);
    }
    setModal(null);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">在线任务看板</h1>
          <p className="mt-1 text-sm text-slate-400">
            拖拽卡片跨列移动 · 点击卡片编辑 · 数据保存在浏览器本地
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs tabular-nums text-slate-400">
            {ready ? `${tasks.length} 个任务` : '加载中…'}
          </span>
          <Button onClick={() => setModal({ mode: 'create' })} disabled={!ready}>
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
              <path
                d="M10 4.5v11M4.5 10h11"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            新建任务
          </Button>
        </div>
      </header>

      {ready ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
          accessibility={{ announcements }}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="grid items-start gap-4 lg:grid-cols-3">
            {STATUSES.map((status) => (
              <BoardColumn
                key={status}
                status={status}
                tasks={columns[status]}
                isDragging={activeId !== null}
                isDropTarget={
                  activeId !== null && overColumn === status && activeTask?.status !== status
                }
                onSelect={handleSelect}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={DROP_ANIMATION}>
            {activeTask ? (
              <div style={activeWidth ? { width: activeWidth } : undefined}>
                <DragOverlayCard task={activeTask} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <BoardSkeleton />
      )}

      {modal ? (
        <TaskModal
          key={modal.mode === 'edit' ? modal.id : 'create'}
          task={editingTask}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
          onDelete={editingTask ? handleDelete : undefined}
        />
      ) : null}
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-3" aria-hidden>
      {STATUSES.map((status) => (
        <div key={status} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="h-3 w-20 animate-pulse rounded bg-slate-800" />
          <div className="mt-4 space-y-2.5">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-24 animate-pulse rounded-xl bg-slate-800/70" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

