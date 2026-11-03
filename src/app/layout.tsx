import type { Metadata, Viewport } from "next";
import { AppProvider } from "@/lib/app-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "DAILY QT",
  description: "매일의 Quiet Time을 함께 기록하는 순 공동체 앱",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#5FBCFC",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="min-h-full font-sans text-text-main">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
