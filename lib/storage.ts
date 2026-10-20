import { SAVE_DEBOUNCE_MS, SEEDED_KEY, STORAGE_KEY } from './constants';
import { isTask } from './task-utils';
import type { Task } from './types';

/** 防抖期间待写入的「最新完整快照」，多次调用直接覆盖，不做队列 */
let pending: Task[] | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let flushHooksRegistered = false;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function writeSnapshot(tasks: Task[]): void {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('[task-board] 写入 localStorage 失败：', error);
  }
}

/**
 * 读取任务列表。
 * 任何异常（无 window、JSON 损坏、结构不符）都降级为空数组，保证看板能正常打开。
 */
export function getTasks(): Task[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isTask);
  } catch (error) {
    console.error('[task-board] 读取 localStorage 失败，已回退为空看板：', error);
    return [];
  }
}

/**
 * 保存任务列表：调用是同步的，实际落盘按 SAVE_DEBOUNCE_MS 防抖。
 * 总是保留最后一次传入的完整快照，避免连续拖拽写入乱序。
 */
export function saveTasks(tasks: Task[]): void {
  if (!canUseStorage()) return;

  pending = tasks;
  registerFlushHooks();

  if (timer !== null) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    flushTasks();
  }, SAVE_DEBOUNCE_MS);
}

/** 立即落盘（页面隐藏 / 组件卸载时调用，防止防抖窗口内丢数据） */
export function flushTasks(): void {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }

  if (!pending) return;

  writeSnapshot(pending);
  pending = null;
}

/** 是否还需要注入首次访问的示例任务 */
export function shouldSeed(): boolean {
  if (!canUseStorage()) return false;

  try {
    return window.localStorage.getItem(SEEDED_KEY) === null;
  } catch {
    return false;
  }
}

export function markSeeded(): void {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(SEEDED_KEY, '1');
  } catch (error) {
    console.error('[task-board] 写入示例任务标记失败：', error);
  }
}

/**
 * 绑定「页面即将离开」的兜底落盘。
 * pagehide 覆盖关闭/刷新/前进后退，visibilitychange 覆盖移动端切后台。
 */
function registerFlushHooks(): void {
  if (flushHooksRegistered || typeof window === 'undefined') return;
  flushHooksRegistered = true;

  window.addEventListener('pagehide', flushTasks);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushTasks();
  });
}
