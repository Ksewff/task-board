# 在线任务看板

一个基于 **Next.js (App Router) + React + TypeScript + Tailwind CSS + @dnd-kit** 的三列任务看板：
支持卡片跨列拖拽、列内排序、任务增删改，数据保存在浏览器 localStorage 中，无需后端。

## 功能

- **三列看板**：待办 / 进行中 / 已完成，任务数实时统计
- **跨列拖拽**：把卡片拖到其他列的任意位置或空白区域；拖拽中目标列高亮，浮层卡片旋转放大
- **列内排序**：同一列内上下拖动调整顺序
- **点击编辑**：点击卡片打开弹窗，修改标题、描述、优先级，或删除任务（二次确认）
- **本地持久化**：所有变更防抖 300ms 写入 localStorage；页面隐藏 / 卸载时立即落盘
- **键盘可用**：卡片可聚焦，`空格` 开始拖动、方向键移动、`空格` 放下、`Esc` 取消，`Enter` 打开编辑
- **健壮性**：读取失败或数据损坏时降级为空看板；首次访问自动注入 3 条示例任务

## 技术栈

| 用途 | 选择 |
| --- | --- |
| 框架 | Next.js 16.4（App Router，Turbopack） |
| UI | React 19 + TypeScript（strict） |
| 样式 | Tailwind CSS v4（`@tailwindcss/turbopack`） |
| 拖拽 | `@dnd-kit/core` / `@dnd-kit/sortable` / `@dnd-kit/utilities` |

未引入 clsx / tailwind-merge / 状态管理库：`lib/cn.ts` 提供 className 合并，状态由单一 `useTasks` 管理。

## 开始使用

```bash
npm install
npm run dev     # http://localhost:3000
```

其他脚本：

```bash
npm run lint    # ESLint（eslint-config-next）
npx tsc --noEmit  # 类型检查
npm run build   # 生产构建
npm start       # 运行生产构建
```

## 目录结构

```
app/
  layout.tsx                 # 根布局（中文 lang、深色底）
  page.tsx                   # 看板页面入口
  globals.css                # Tailwind v4 入口 + 动画 / 滚动条样式
components/
  board/
    task-board.tsx           # DndContext、拖拽状态、弹窗编排、骨架屏
    board-column.tsx         # 单列（useDroppable + SortableContext）
    sortable-task-card.tsx   # 可拖拽卡片（useSortable + 点击/回车编辑）
    task-card.tsx            # 纯展示卡片（列内与拖拽浮层复用）
    drag-overlay-card.tsx    # DragOverlay 浮层卡片
  task/
    task-modal.tsx           # 新建 / 编辑 / 删除弹窗表单
  ui/
    button.tsx               # Button 变体
    field.tsx                # Field / TextInput / TextArea
    modal.tsx                # Modal（portal、Esc、焦点回收、滚动锁）
    priority-badge.tsx       # 优先级徽标
hooks/
  use-tasks.ts               # 任务状态唯一入口（tasks、actions、ready）
  use-hydrated.ts            # 水合标记（useSyncExternalStore）
lib/
  types.ts                   # Task / Status / Priority / TaskDraft
  constants.ts               # 存储键、列 / 优先级元数据、droppable id
  task-utils.ts              # 纯函数：create / update / remove / groupByStatus / resolveDrop
  storage.ts                 # localStorage 读写、防抖落盘、脏数据校验
  seed.ts                    # 首次访问的示例任务
  id.ts                      # crypto.randomUUID + 降级
  cn.ts                      # className 合并
```

## 设计要点

**单一数据源。** 只有 `tasks: Task[]` 一个数组，三列内容由 `groupByStatus` 派生（`useMemo`），
不存在「每列各存一份数组」导致的两份状态不同步问题。

**预览与提交分离。** 拖拽过程中不修改 `tasks`，只记录 `activeId` / `overColumn` 用于渲染高亮；
真正的位置计算只发生在 `onDragEnd`，由纯函数 `resolveDrop` 一次性算出新数组。

**避免闭包旧值。** `useTasks` 内部维护 `tasksRef`，所有事件处理器只读 `ref.current`，
写操作统一走 `commit(next)`：`ref → setState → saveTasks` 同帧完成。快速连续拖拽也不会丢更新。

**渲染与拖拽 transform 解耦。** 排序位移作用在 `<li>`（`CSS.Transform`），
旋转/放大只作用在 `DragOverlay` 内部一层（`.animate-card-lift` 关键帧），两者不叠加，松手不跳位。

**点击 vs 拖拽。** `PointerSensor` 设置 `activationConstraint.distance = 8`：
小于 8px 视为点击（打开弹窗），超过才进入拖拽；拖拽结束后的那次 `click` 由时间窗拦截。

## 数据格式

localStorage key：`task-board:tasks:v1`

```ts
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  createdAt: number; // 毫秒时间戳
}
```

首次访问标记：`task-board:seeded:v1`。清空这两个 key 即可恢复初始示例任务。

## 已知限制

- 数据仅存于当前浏览器，不同设备/浏览器之间不同步
- 单用户场景，未做并发写冲突处理
- 未实现列内虚拟滚动，单列数百张卡片时建议再优化
