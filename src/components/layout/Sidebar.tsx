"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BedDouble,
  CalendarDays,
  BookOpen,
  Rss,
  BarChart3,
  Tag,
  Settings,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/config/constants";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Rooms", href: "/rooms", icon: BedDouble },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Bookings", href: "/bookings", icon: BookOpen },
  { label: "Channels", href: "/channels", icon: Rss },
  { label: "Rate Plans", href: "/rates", icon: Tag },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
];

const bottomItems = [
  { label: "Properties", href: "/properties", icon: Building2 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
          <BedDouble className="h-5 w-5" />
        </div>
        <span className="text-lg font-bold text-gray-900">{APP_NAME}</span>
      </div>

      {/* Main nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive(href)
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 flex-shrink-0",
                isActive(href) ? "text-blue-600" : "text-gray-400"
              )}
            />
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="border-t border-gray-100 p-3">
        {bottomItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive(href)
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4",
                isActive(href) ? "text-blue-600" : "text-gray-400"
              )}
            />
            {label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
