import type { Priority, Status } from './types';

/** localStorage 存储键（带版本号，便于后续结构升级） */
export const STORAGE_KEY = 'task-board:tasks:v1';
/** 首次访问是否已注入示例任务的标记 */
export const SEEDED_KEY = 'task-board:seeded:v1';

/** 写盘防抖时间（ms） */
export const SAVE_DEBOUNCE_MS = 300;

/** 列 droppable id 前缀：避免和任务 uuid 撞 id */
export const COLUMN_PREFIX = 'column:';

export const STATUSES = ['todo', 'in-progress', 'done'] as const satisfies readonly Status[];

export const PRIORITIES = ['high', 'medium', 'low'] as const satisfies readonly Priority[];

export interface ColumnMeta {
  title: string;
  description: string;
  dotClassName: string;
  titleClassName: string;
}

export const COLUMN_META: Record<Status, ColumnMeta> = {
  todo: {
    title: '待办',
    description: '还没开始',
    dotClassName: 'bg-slate-400',
    titleClassName: 'text-slate-300',
  },
  'in-progress': {
    title: '进行中',
    description: '正在推进',
    dotClassName: 'bg-indigo-400',
    titleClassName: 'text-indigo-200',
  },
  done: {
    title: '已完成',
    description: '已经收尾',
    dotClassName: 'bg-emerald-400',
    titleClassName: 'text-emerald-200',
  },
};

export interface PriorityMeta {
  label: string;
  badgeClassName: string;
  dotClassName: string;
  weight: number;
}

export const PRIORITY_META: Record<Priority, PriorityMeta> = {
  high: {
    label: '高',
    badgeClassName: 'border-red-500/30 bg-red-500/15 text-red-300',
    dotClassName: 'bg-red-400',
    weight: 3,
  },
  medium: {
    label: '中',
    badgeClassName: 'border-amber-500/30 bg-amber-500/15 text-amber-300',
    dotClassName: 'bg-amber-400',
    weight: 2,
  },
  low: {
    label: '低',
    badgeClassName: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
    dotClassName: 'bg-emerald-400',
    weight: 1,
  },
};

export function columnDroppableId(status: Status): string {
  return `${COLUMN_PREFIX}${status}`;
}
