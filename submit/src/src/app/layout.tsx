import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "지진해일 수치모델 자동화 플랫폼 · teamH",
  description:
    "파라미터 설정 → 다중 시나리오 자동 수행 → 부산권(마린시티·해운대) 3D 침수 시각화",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full">
      <head>
        {/* Pretendard (가변 폰트, 동적 서브셋) — 폰트 통일 */}
        <link
          rel="stylesheet"
          as="style"
          // eslint-disable-next-line @next/next/no-page-custom-font
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
