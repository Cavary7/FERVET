import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { PWARegister } from "@/components/pwa-register";
import { LaunchSplash } from "@/components/launch-splash";
import { BRANDING } from "@/lib/branding";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: BRANDING.appName,
  description: BRANDING.description,
  applicationName: BRANDING.appName,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: BRANDING.appName,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: BRANDING.iconPath,
    apple: BRANDING.iconPath,
  },
};

export const viewport: Viewport = {
  themeColor: "#08111f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="dark" lang="en">
      <body className="bg-background text-foreground" style={{ backgroundColor: "#07111f" }}>
        <StoreProvider>
          <PWARegister />
          <LaunchSplash />
          {children}
          <BottomNav />
        </StoreProvider>
      </body>
    </html>
  );
}
