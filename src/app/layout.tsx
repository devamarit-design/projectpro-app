import type { Metadata, Viewport } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/lib/i18n-context";
import { ProjectProvider } from "@/context/project-context";
import { NotificationProvider } from "@/context/notification-context";
import { SettingsProvider } from "@/context/settings-context";
import { SecurityProvider } from "@/context/security-context";
import { LockScreen } from "@/components/auth/lock-screen";
import { OrganizationProvider } from "@/context/organization-context"; // New Import
import { ThemeSync } from "@/components/theme-sync";
import { Toaster } from "sonner";
import { SpeedInsights } from "@vercel/speed-insights/next"

const kanit = Kanit({
  subsets: ["latin", "thai"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "HipslothProject App",
    template: "%s | HipslothProject",
  },
  description: "Modern Construction & Project Management for Teams. Track projects, expenses, and site work in one place.",
  keywords: ["Construction", "Project Management", "Thai Construction", "SME", "Site Management"],
  authors: [{ name: "HipslothProject Team" }],
  creator: "HipslothProject Team",
  metadataBase: new URL("https://hipslothproject.app"),
  openGraph: {
    title: "HipslothProject - Modern Construction Management",
    description: "Manage your construction projects, expenses, and team efficiently.",
    url: "https://hipslothproject.app",
    siteName: "HipslothProject",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "HipslothProject Dashboard",
      },
    ],
    locale: "th_TH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HipslothProject App",
    description: "Modern Construction & Project Management for Teams",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HipslothProject",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${kanit.variable} font-sans antialiased overflow-x-hidden`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <OrganizationProvider>
              <ProjectProvider>
                <SettingsProvider>
                  <NotificationProvider>
                    <SecurityProvider>
                      {/* Glass Status Bar Overlay for PWA */}
                      <div
                        className="fixed top-0 left-0 right-0 z-[200] pointer-events-none backdrop-blur-md bg-background/30 transition-colors duration-300"
                        style={{ height: 'env(safe-area-inset-top)' }}
                      />
                      <LockScreen />
                      <ThemeSync />
                      <Toaster
                        position="top-center"
                        toastOptions={{
                          className: "bg-black/80 backdrop-blur-xl border border-white/10 text-white shadow-2xl rounded-2xl p-4 gap-3",
                          style: {
                            background: 'rgba(0,0,0,0.8)',
                            backdropFilter: 'blur(16px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white',
                          },
                          classNames: {
                            toast: "bg-black/80 backdrop-blur-xl border border-white/10 text-white shadow-2xl rounded-2xl",
                            title: "text-white font-bold text-sm",
                            description: "text-white/70 text-xs",
                            actionButton: "bg-white text-black font-bold",
                            cancelButton: "bg-white/10 text-white hover:bg-white/20",
                            success: "border-emerald-500/50 bg-emerald-500/10 text-emerald-500",
                            error: "border-red-500/50 bg-red-500/10 text-red-500",
                            warning: "border-amber-500/50 bg-amber-500/10 text-amber-500",
                            info: "border-blue-500/50 bg-blue-500/10 text-blue-500",
                          }
                        }}
                      />
                      {children}
                      <SpeedInsights />
                    </SecurityProvider>
                  </NotificationProvider>
                </SettingsProvider>
              </ProjectProvider>
            </OrganizationProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
