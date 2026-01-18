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

const kanit = Kanit({
  subsets: ["latin", "thai"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "PROJECTPRO App",
    template: "%s | PROJECTPRO",
  },
  description: "Modern Construction & Project Management for Teams. Track projects, expenses, and site work in one place.",
  keywords: ["Construction", "Project Management", "Thai Construction", "SME", "Site Management"],
  authors: [{ name: "ProjectPro Team" }],
  creator: "ProjectPro Team",
  metadataBase: new URL("https://projectpro.app"),
  openGraph: {
    title: "PROJECTPRO - Modern Construction Management",
    description: "Manage your construction projects, expenses, and team efficiently.",
    url: "https://projectpro.app",
    siteName: "PROJECTPRO",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PROJECTPRO Dashboard",
      },
    ],
    locale: "th_TH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PROJECTPRO App",
    description: "Modern Construction & Project Management for Teams",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  }
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${kanit.variable} font-sans antialiased`} suppressHydrationWarning>
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
                      <LockScreen />
                      <ThemeSync />
                      {children}
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
