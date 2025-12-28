
'use client';

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type DashboardCardProps = {
  title: string
  icon: LucideIcon
  href: string
  color: string
}

export function DashboardCard({ title, icon: Icon, href, color }: DashboardCardProps) {
  return (
    <Link href={href} className="group block">
      <Card 
        className={cn(
          "bg-card transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-2xl text-white h-48",
          color
        )}
      >
        <CardContent className="flex flex-col items-center justify-center p-6 text-center h-full">
          <div className="p-4 bg-white/20 rounded-full mb-4">
            <Icon 
              className="text-white transition-transform duration-300 group-hover:scale-110 w-10 h-10"
            />
          </div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </CardContent>
      </Card>
    </Link>
  )
}
