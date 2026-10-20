export type Status = 'todo' | 'in-progress' | 'done';
export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  createdAt: number;
}

/** 新建 / 编辑表单提交的字段（不含 id、status、createdAt） */
export type TaskDraft = Pick<Task, 'title' | 'description' | 'priority'>;
