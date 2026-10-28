import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: '도서관 지도 | 전국 공공도서관 현황', description: '대한민국 공공도서관 위치와 지역별 현황을 살펴보세요.' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="ko"><body>{children}</body></html>; }
