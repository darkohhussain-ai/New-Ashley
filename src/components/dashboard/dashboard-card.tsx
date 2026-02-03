
'use client';

import Link from "next/link"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { ChevronRight } from 'lucide-react';

type DashboardCardProps = {
  title: string
  icon: LucideIcon
  href: string
  color: string
}

export function DashboardCard({ title, icon: Icon, href, color }: DashboardCardProps) {
  return (
    <Link href={href} className="group block -mx-2 rounded-lg transition-colors hover:bg-accent">
      <div className="flex items-center p-3">
        <div className={cn("p-3 rounded-lg text-white", color)}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="ml-4 font-medium text-foreground/90">{title}</span>
        <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  )
}
