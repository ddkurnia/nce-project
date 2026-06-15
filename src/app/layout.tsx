import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "NCE — Indonesia's Digital Trading Floor",
  description: "Lantai Perdagangan Komoditas Digital Indonesia. Pantau pasar komoditas real-time.",
  icons: {
    icon: "/assets/images/icons/favicon-32x32.png",
    apple: "/assets/images/icons/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#081120",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body style={{ margin: 0, padding: 0, background: '#081120', color: '#FFFFFF' }}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
