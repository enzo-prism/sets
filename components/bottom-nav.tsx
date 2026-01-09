"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, Home, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/trends", label: "Trends", icon: TrendingUp },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[480px] items-center gap-2 px-3 py-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Button
              key={item.href}
              asChild
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "h-auto flex-1 flex-col gap-1 rounded-xl px-2 py-2 text-xs",
                isActive && "shadow-sm"
              )}
            >
              <Link href={item.href} aria-current={isActive ? "page" : undefined}>
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
