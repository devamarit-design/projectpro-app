import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/lib/i18n-context";
import { ProjectProvider } from "@/context/project-context";
import { NotificationProvider } from "@/context/notification-context";
import { SettingsProvider } from "@/context/settings-context";
import { SecurityProvider } from "@/context/security-context";
import { LockScreen } from "@/components/auth/lock-screen";

const kanit = Kanit({
  subsets: ["latin", "thai"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "PROJECTPRO App",
  description: "Modern Project Management for Teams",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  themeColor: "#000000",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
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
            <ProjectProvider>
              <SettingsProvider>
                <NotificationProvider>
                  <SecurityProvider>
                    <LockScreen />
                    {children}
                  </SecurityProvider>
                </NotificationProvider>
              </SettingsProvider>
            </ProjectProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
