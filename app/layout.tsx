import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_KR, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans_KR({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "번호수첩",
  description: "이름, 전화번호, 그룹, 메모를 저장하고 초성으로 빠르게 찾는 전화번호부",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
