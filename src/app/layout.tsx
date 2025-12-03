import type { Metadata } from "next";
import "./globals.css";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { QueryProvider } from "@/components/providers/query-provider";

export const metadata: Metadata = {
  title: "カンタンデータクローラー",
  description: "広告プラットフォームのデータを自動的にGoogleスプレッドシートに出力",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <AuthSessionProvider>
          <QueryProvider>{children}</QueryProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}

