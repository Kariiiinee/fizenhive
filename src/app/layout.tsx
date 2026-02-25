import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FizenHive",
  description: "Your Emerald Investment Assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="pb-16 md:pb-0 print:pb-0" suppressHydrationWarning>
      <body className={`${inter.className} antialiased min-h-screen print:min-h-0 bg-background`} suppressHydrationWarning>
        <main className="w-full min-h-screen print:min-h-0 relative shadow-xl md:shadow-none overflow-x-hidden print:max-w-none print:w-auto print:shadow-none print:overflow-visible bg-background">
          <div className="print:hidden">
            <Header />
          </div>
          {children}
        </main>
        <div className="md:hidden print:hidden">
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
