import type { NextConfig } from "next";

// 모든 경로에 붙이는 보안 헤더
const securityHeaders = [
  // 다른 사이트가 우리 화면을 틀(iframe) 안에 넣어 버튼을 누르게 하는 공격(클릭재킹)을 막는다.
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // 설문 링크 주소가 다른 사이트로 새지 않게 한다.
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // 서버 종류(X-Powered-By)를 응답에 드러내지 않는다.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
