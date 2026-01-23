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
                        position="bottom-center"
                        toastOptions={{
                          unstyled: true,
                          classNames: {
                            toast: "bg-background/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-4 gap-3 flex items-center w-full md:w-[356px]",
                            title: "text-foreground font-semibold text-sm",
                            description: "text-muted-foreground text-xs",
                            actionButton: "bg-primary text-primary-foreground font-medium text-xs px-3 py-1.5 rounded-lg",
                            cancelButton: "bg-muted text-muted-foreground hover:bg-muted/80 text-xs px-3 py-1.5 rounded-lg",
                            success: "border-emerald-500/20 text-emerald-500",
                            error: "border-red-500/20 text-red-500",
                            warning: "border-amber-500/20 text-amber-500",
                            info: "border-blue-500/20 text-blue-500",
                          },
                          style: {
                            bottom: 'calc(env(safe-area-inset-bottom) + 24px)',
                          },
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
