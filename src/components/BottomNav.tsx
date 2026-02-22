"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LineChart, Bookmark, SlidersHorizontal, MessageCircle } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Portfolio", href: "/", icon: Home },
    { name: "Analysis", href: "/analysis", icon: LineChart },
    { name: "My Analysis", href: "/my-analysis", icon: Bookmark, isCenter: false },
    { name: "Screener", href: "/screener", icon: SlidersHorizontal },
    { name: "AI Assistant", href: "/chat", icon: MessageCircle },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border pb-safe">
      <div className="flex justify-around items-center h-16 relative">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (index === 2) {
            // Center prominent button
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -top-4 flex flex-col items-center justify-center p-3 bg-primary text-primary-foreground rounded-full shadow-lg border-4 border-background transition-transform hover:scale-105 active:scale-95"
              >
                <Icon className="w-6 h-6" strokeWidth={2.5} />
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
