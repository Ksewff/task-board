/**
 * 轻量 className 合并工具。
 * 项目刻意不引入 clsx / tailwind-merge，保持依赖面最小。
 */
export type ClassValue = string | false | null | undefined;

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
