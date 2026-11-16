import type { Metadata, Viewport } from "next";
import { AppProvider } from "@/lib/app-context";
import { SkyModeSync } from "@/components/layout/SkyModeSync";
import { SKY_MODE_BOOTSTRAP } from "@/lib/sky-mode";
import "./globals.css";

export const metadata: Metadata = {
  title: "드림 매일큐티",
  description: "매일의 Quiet Time을 함께 기록하는 순 공동체 앱",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#5fbcfc", /* --sky */
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased" data-sky-mode="낮모드">
      <head>
        <script dangerouslySetInnerHTML={{ __html: SKY_MODE_BOOTSTRAP }} />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="min-h-full font-sans antialiased text-text-main">
        <SkyModeSync />
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
