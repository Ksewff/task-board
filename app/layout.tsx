import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '在线任务看板',
  description: '基于 Next.js + @dnd-kit 的可拖拽任务看板，数据保存在浏览器本地。',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full bg-slate-950 font-sans text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
