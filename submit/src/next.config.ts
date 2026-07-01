import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 개발 모드 좌하단 Next.js 인디케이터(N 버튼) 숨김
  devIndicators: false,
  // 외부 URL(Cloudflare 임시 터널 등)에서 개발 리소스(/_next/*·HMR) 접근 허용.
  // 없으면 터널 접속 시 JS가 차단되어 화면이 멈춤(3D 미표출·클릭 불가).
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "sally-collector-tank-indicating.trycloudflare.com",
  ],
};

export default nextConfig;
