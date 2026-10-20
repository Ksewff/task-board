'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Field, TextArea, TextInput } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { PRIORITIES, PRIORITY_META } from '@/lib/constants';
import { cn } from '@/lib/cn';
import type { Priority, Task, TaskDraft } from '@/lib/types';

interface TaskModalProps {
  /** null 表示新建 */
  task: Task | null;
  onClose: () => void;
  onSubmit: (draft: TaskDraft) => void;
  onDelete?: () => void;
}

export function TaskModal({ task, onClose, onSubmit, onDelete }: TaskModalProps) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium');
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const isEditing = task !== null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('请填写任务标题');
      return;
    }

    onSubmit({ title: trimmedTitle, description, priority });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEditing ? '编辑任务' : '新建任务'}
      description={isEditing ? '修改后点击保存，变更会立即写入本地存储。' : '新任务默认进入「待办」列。'}
      footer={
        <>
          {onDelete ? (
            confirmingDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-300">确认删除？</span>
                <Button variant="danger" size="sm" onClick={onDelete}>
                  删除
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>
                  取消
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(true)}>
                删除任务
              </Button>
            )
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" form="task-form">
              保存
            </Button>
          </div>
        </>
      }
    >
      <form id="task-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="标题" htmlFor="task-title" error={error ?? undefined}>
          <TextInput
            id="task-title"
            data-autofocus
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (error) setError(null);
            }}
            placeholder="例如：完成看板拖拽交互"
            maxLength={120}
            autoComplete="off"
          />
        </Field>

        <Field label="描述" htmlFor="task-description" hint={`${description.length}/500`}>
          <TextArea
            id="task-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="补充任务背景、验收标准…"
            maxLength={500}
          />
        </Field>

        <div className="space-y-1.5">
          <span className="text-xs font-medium text-slate-300">优先级</span>
          <div role="group" aria-label="优先级" className="grid grid-cols-3 gap-2">
            {PRIORITIES.map((value) => {
              const meta = PRIORITY_META[value];
              const selected = priority === value;

              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setPriority(value)}
                  className={cn(
                    'flex h-9 items-center justify-center gap-1.5 rounded-lg border text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70',
                    selected
                      ? cn(meta.badgeClassName, 'ring-1 ring-inset ring-white/10')
                      : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-600 hover:text-slate-200',
                  )}
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full', meta.dotClassName)} aria-hidden />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>
      </form>
    </Modal>
  );
}
