import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import { LanguageProvider } from "@/lib/i18n";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FizenHive",
  description: "Your Emerald Investment Assistant",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo_fizenhive1.png",
    apple: "/logo_fizenhive1.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FizenHive",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="pb-16 md:pb-0 print:pb-0" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased min-h-screen print:min-h-0 bg-background`} suppressHydrationWarning>
        <LanguageProvider>
          <main className="w-full min-h-screen print:min-h-0 relative shadow-xl md:shadow-none overflow-x-hidden print:max-w-none print:w-auto print:shadow-none print:overflow-visible bg-background">
            <div className="print:hidden">
              <Header />
            </div>
            {children}
          </main>
          <div className="md:hidden print:hidden">
            <BottomNav />
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
