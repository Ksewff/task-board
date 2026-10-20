'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useHydrated } from '@/hooks/use-hydrated';
import { createSeedTasks } from '@/lib/seed';
import { flushTasks, getTasks, markSeeded, saveTasks, shouldSeed } from '@/lib/storage';
import { createTask, removeTask, resolveDrop, updateTask } from '@/lib/task-utils';
import type { Task, TaskDraft } from '@/lib/types';

export interface UseTasksResult {
  tasks: Task[];
  /** 客户端水合完成前为 false，用于渲染骨架屏并避免 hydration mismatch */
  ready: boolean;
  addTask: (draft: TaskDraft) => void;
  editTask: (id: string, draft: Partial<TaskDraft>) => void;
  deleteTask: (id: string) => void;
  /** 拖拽结束：一次性提交移动结果并写盘 */
  dropTask: (activeId: string, overId: string | null) => void;
}

interface InitialState {
  tasks: Task[];
  seeded: boolean;
}

/**
 * 首屏数据只在 useState 的惰性初始化里算一次：
 * 服务端没有 window → 空看板；客户端 → 读 localStorage（必要时生成示例任务）。
 * 不放在 effect 里 setState，避免级联渲染与 React Compiler 规则告警。
 */
function loadInitialState(): InitialState {
  if (typeof window === 'undefined') return { tasks: [], seeded: false };

  const stored = getTasks();
  if (stored.length > 0) return { tasks: stored, seeded: false };

  if (!shouldSeed()) return { tasks: [], seeded: false };

  return { tasks: createSeedTasks(), seeded: true };
}

/**
 * 任务状态的唯一入口。
 *
 * 关键点：
 * 1. tasks 是唯一数据源，三列内容由调用方 useMemo 派生；
 * 2. tasksRef 始终镜像最新数组，事件处理器只读 ref，避免闭包拿到旧值；
 * 3. 所有写操作都走 commit：ref → setState → saveTasks 一次完成。
 */
export function useTasks(): UseTasksResult {
  const [initial] = useState<InitialState>(loadInitialState);
  const [tasks, setTasks] = useState<Task[]>(initial.tasks);
  const tasksRef = useRef<Task[]>(initial.tasks);
  const hydrated = useHydrated();

  const commit = useCallback((next: Task[]) => {
    tasksRef.current = next;
    setTasks(next);
    saveTasks(next);
  }, []);

  useEffect(() => {
    if (initial.seeded) {
      markSeeded();
      saveTasks(initial.tasks);
      // 立即落盘，避免刷新过快时示例任务还没写入
      flushTasks();
    }

    return () => {
      flushTasks();
    };
  }, [initial]);

  const addTask = useCallback(
    (draft: TaskDraft) => {
      commit([...tasksRef.current, createTask(draft)]);
    },
    [commit],
  );

  const editTask = useCallback(
    (id: string, draft: Partial<TaskDraft>) => {
      const next = updateTask(tasksRef.current, id, draft);
      if (next !== tasksRef.current) commit(next);
    },
    [commit],
  );

  const deleteTask = useCallback(
    (id: string) => {
      const next = removeTask(tasksRef.current, id);
      if (next !== tasksRef.current) commit(next);
    },
    [commit],
  );

  const dropTask = useCallback(
    (activeId: string, overId: string | null) => {
      const next = resolveDrop(tasksRef.current, activeId, overId);
      if (next !== tasksRef.current) commit(next);
    },
    [commit],
  );

  return { tasks, ready: hydrated, addTask, editTask, deleteTask, dropTask };
}
