import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { BottomNav, SideNav } from "@/components/navigation";
import { ThemeProvider } from "@/components/theme-provider";
import { ServiceWorkerRegister } from "@/components/pwa/register-sw";
import { NotificationScheduler } from "@/components/pwa/notification-scheduler";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Denis — Organizador de estudio",
  description:
    "Organiza materias, calendario académico, planner semanal y recordatorios para medicina.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Denis",
  },
};

export const viewport: Viewport = {
  themeColor: "#2d6a6a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geist.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full bg-[var(--background)] antialiased">
        <ThemeProvider>
          <div className="flex min-h-full">
            <SideNav />
            <main className="flex-1 pb-24 md:pb-6">
              <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">{children}</div>
            </main>
          </div>
          <BottomNav />
          <ServiceWorkerRegister />
          <NotificationScheduler />
        </ThemeProvider>
      </body>
    </html>
  );
}
