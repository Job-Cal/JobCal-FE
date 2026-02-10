import type { Metadata } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import './globals.css'

const notoSansKr = Noto_Sans_KR({ subsets: ['latin'], weight: ['400', '500', '700', '900'] })

export const metadata: Metadata = {
  title: 'JobCal - 채용 일정 관리',
  description: '개인 취준생용 채용 일정 관리 서비스',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={notoSansKr.className}>{children}</body>
    </html>
  )
}
