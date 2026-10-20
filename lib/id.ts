/**
 * 生成任务 id。
 * crypto.randomUUID 在非安全上下文（http 内网地址）下不可用，需要降级。
 */
export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
