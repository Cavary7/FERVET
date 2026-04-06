import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { PWARegister } from "@/components/pwa-register";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "Fervet",
  description: "A disciplined personal life OS for visible consistency.",
  applicationName: "Fervet",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fervet",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
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
      <body className="bg-background text-foreground">
        <StoreProvider>
          <PWARegister />
          {children}
          <BottomNav />
        </StoreProvider>
      </body>
    </html>
  );
}
