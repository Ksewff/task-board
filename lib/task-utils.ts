import { COLUMN_PREFIX, STATUSES } from './constants';
import { createId } from './id';
import type { Priority, Status, Task, TaskDraft } from './types';

/** 数组内移动（不依赖 dnd-kit，保证 lib 层可独立测试） */
function arrayMove<T>(items: readonly T[], from: number, to: number): T[] {
  const next = items.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function isStatus(value: unknown): value is Status {
  return typeof value === 'string' && (STATUSES as readonly string[]).includes(value);
}

export function isPriority(value: unknown): value is Priority {
  return value === 'low' || value === 'medium' || value === 'high';
}

/** localStorage 反序列化后的结构校验，脏数据直接丢弃 */
export function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    typeof candidate.title === 'string' &&
    typeof candidate.description === 'string' &&
    isStatus(candidate.status) &&
    isPriority(candidate.priority) &&
    typeof candidate.createdAt === 'number' &&
    Number.isFinite(candidate.createdAt)
  );
}

export function createTask(draft: TaskDraft, status: Status = 'todo'): Task {
  return {
    id: createId(),
    title: draft.title.trim(),
    description: draft.description.trim(),
    status,
    priority: draft.priority,
    createdAt: Date.now(),
  };
}

export function groupByStatus(tasks: readonly Task[]): Record<Status, Task[]> {
  const grouped: Record<Status, Task[]> = { todo: [], 'in-progress': [], done: [] };

  for (const task of tasks) {
    grouped[task.status].push(task);
  }

  return grouped;
}

/** 把 droppable id（列容器 id 或任务 id）解析为状态；无法解析返回 null */
export function statusOfDroppableId(id: string, tasks: readonly Task[]): Status | null {
  if (id.startsWith(COLUMN_PREFIX)) {
    const status = id.slice(COLUMN_PREFIX.length);
    return isStatus(status) ? status : null;
  }

  return tasks.find((task) => task.id === id)?.status ?? null;
}

export function updateTask(tasks: Task[], id: string, draft: Partial<TaskDraft>): Task[] {
  let changed = false;

  const next = tasks.map((task) => {
    if (task.id !== id) return task;

    const title = (draft.title ?? task.title).trim();
    const description = (draft.description ?? task.description).trim();
    const priority = draft.priority ?? task.priority;

    if (title === task.title && description === task.description && priority === task.priority) {
      return task;
    }

    changed = true;
    return { ...task, title, description, priority };
  });

  return changed ? next : tasks;
}

export function removeTask(tasks: Task[], id: string): Task[] {
  const next = tasks.filter((task) => task.id !== id);
  return next.length === tasks.length ? tasks : next;
}

/**
 * 拖拽落点解析（纯函数，无副作用）。
 *
 * 覆盖 5 种落点：
 * 1. 同列卡片之间 → arrayMove
 * 2. 跨列卡片 → 改 status 并插到目标卡片位置
 * 3. 跨列列容器（含空列）→ 改 status 并追加到该列末尾
 * 4. 落在自己身上 → 返回原数组（引用相同，调用方跳过提交）
 * 5. 数据异常 / over 为 null → 返回原数组
 */
export function resolveDrop(tasks: Task[], activeId: string, overId: string | null): Task[] {
  if (!overId || activeId === overId) return tasks;

  const activeIndex = tasks.findIndex((task) => task.id === activeId);
  if (activeIndex === -1) return tasks;

  const active = tasks[activeIndex];
  const targetStatus = statusOfDroppableId(overId, tasks);
  if (!targetStatus) return tasks;

  const isColumnTarget = overId.startsWith(COLUMN_PREFIX);

  // 同列内排序：交给 arrayMove，和 dnd-kit 的排序手感保持一致
  if (!isColumnTarget && active.status === targetStatus) {
    const overIndex = tasks.findIndex((task) => task.id === overId);
    if (overIndex === -1 || overIndex === activeIndex) return tasks;
    return arrayMove(tasks, activeIndex, overIndex);
  }

  const rest = tasks.filter((task) => task.id !== activeId);
  const moved: Task = active.status === targetStatus ? active : { ...active, status: targetStatus };

  let insertAt: number;

  if (isColumnTarget) {
    // 落在列容器上：插到该列最后一张卡片之后
    let lastIndexInColumn = -1;
    rest.forEach((task, index) => {
      if (task.status === targetStatus) lastIndexInColumn = index;
    });
    insertAt = lastIndexInColumn === -1 ? rest.length : lastIndexInColumn + 1;
  } else {
    insertAt = rest.findIndex((task) => task.id === overId);
    if (insertAt === -1) return tasks;
  }

  return [...rest.slice(0, insertAt), moved, ...rest.slice(insertAt)];
}

/** 卡片上的创建日期（仅客户端渲染，避免服务端/客户端时区不一致） */
export function formatTaskDate(timestamp: number): string {
  const date = new Date(timestamp);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${month}/${day}`;
}
