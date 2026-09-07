import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: '桃庭 · 春日庭院',
  description: '一方庭院，一树春色。自由观赏的中式古典庭院微缩景观。',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
