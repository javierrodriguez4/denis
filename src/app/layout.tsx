import type { Metadata, Viewport } from "next";
import { Inter, Schibsted_Grotesk } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { ThemeProvider } from "@/components/theme-provider";
import { ServiceWorkerRegister } from "@/components/pwa/register-sw";
import { NotificationScheduler } from "@/components/pwa/notification-scheduler";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const schibsted = Schibsted_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
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
  themeColor: "#2F7E72",
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
    <html
      lang="es"
      className={`${inter.variable} ${schibsted.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-[var(--bg)] antialiased">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
          <ServiceWorkerRegister />
          <NotificationScheduler />
        </ThemeProvider>
      </body>
    </html>
  );
}
