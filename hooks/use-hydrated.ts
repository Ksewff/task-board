'use client';

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * 是否已完成客户端水合。
 * 用 useSyncExternalStore 而不是 useEffect + setState：
 * 服务端快照固定为 false、客户端固定为 true，既没有 hydration mismatch，
 * 也不会触发 React Compiler 的 set-state-in-effect 规则。
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
