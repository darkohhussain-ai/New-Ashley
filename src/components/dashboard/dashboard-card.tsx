
'use client';

import Link from "next/link"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
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
    <Link href={href} className="group block" passHref>
        <Card className="h-full flex flex-col items-center justify-center text-center p-6 transition-transform transform hover:-translate-y-1 hover:shadow-xl">
          <div className={cn("p-4 rounded-full text-white mb-4", color)}>
              <Icon className="w-8 h-8" />
          </div>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </Card>
    </Link>
  )
}
