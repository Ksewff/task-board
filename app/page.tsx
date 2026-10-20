import { TaskBoard } from '@/components/board/task-board';

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <TaskBoard />
    </main>
  );
}
