import type { Metadata, Viewport } from "next";
import "./globals.css";
import { WebsiteTheme } from "@/components/WebsiteTheme";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#101113" },
  ],
};

export const metadata: Metadata = {
  title: "Timetable Wallpaper — One-Week iPhone Schedule Wallpapers",
  description:
    "Turn your university class timetable into a colorful, aesthetic iPhone wallpaper with subjects in distinct colors. Upload, review, customize and download.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('website-theme');document.documentElement.dataset.theme=t==='light'||t==='dark'?t:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}catch(e){document.documentElement.dataset.theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}})()`,
          }}
        />
      </head>
      <body>
        <WebsiteTheme>{children}</WebsiteTheme>
      </body>
    </html>
  );
}
