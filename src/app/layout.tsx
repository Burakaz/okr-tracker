import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { QueryProvider } from "@/providers/QueryProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ADMKRS OKR Tracker",
  description: "OKR/KPI Tracker für Mitarbeiterentwicklung",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={`${inter.className} antialiased min-h-screen bg-background`} suppressHydrationWarning>
        <QueryProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            duration={3000}
            toastOptions={{
              style: {
                borderRadius: '12px',
                fontSize: '13px',
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
