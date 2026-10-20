import { createTask } from './task-utils';
import type { Status, Task, TaskDraft } from './types';

interface SeedDefinition extends TaskDraft {
  status: Status;
}

const SEED_DEFINITIONS: SeedDefinition[] = [
  {
    title: '欢迎使用在线任务看板',
    description: '拖动卡片可以在三列之间移动，松手后会自动写入浏览器本地存储。',
    priority: 'medium',
    status: 'todo',
  },
  {
    title: '点击卡片编辑任务',
    description: '可以修改标题、描述与优先级，也可以在弹窗里删除任务。',
    priority: 'high',
    status: 'in-progress',
  },
  {
    title: '把卡片拖到「已完成」试试',
    description: '拖拽中的卡片会旋转放大，目标列会高亮提示。',
    priority: 'low',
    status: 'done',
  },
];

/**
 * 首次访问注入的示例任务。
 * createdAt 递增，保证各列内的展示顺序稳定。
 */
export function createSeedTasks(): Task[] {
  const now = Date.now();

  return SEED_DEFINITIONS.map(({ status, ...draft }, index) => ({
    ...createTask(draft, status),
    createdAt: now - (SEED_DEFINITIONS.length - index) * 1000,
  }));
}
