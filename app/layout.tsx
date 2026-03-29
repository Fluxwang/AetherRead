import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

type ThemeMode = "light" | "dark";
const THEME_STORAGE_KEY = "aether-theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aether Read - 移动阅读",
  description: "移动端英文文章阅读应用，支持AI翻译和总结",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

function parseThemeMode(theme: string | undefined): ThemeMode | undefined {
  return theme === "light" || theme === "dark" ? theme : undefined;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeFromCookie = parseThemeMode(
    cookieStore.get(THEME_STORAGE_KEY)?.value,
  );

  return (
    <html
      lang="zh-CN"
      data-theme={themeFromCookie}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <div className="mobile-shell">{children}</div>
      </body>
    </html>
  );
}
