import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";

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
    <html lang="en" className="pb-16">
      <body className={`${inter.className} antialiased min-h-screen bg-background`}>
        <main className="max-w-md mx-auto w-full min-h-screen relative shadow-xl overflow-x-hidden bg-background">
          {children}
        </main>
        <div className="max-w-md mx-auto">
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
