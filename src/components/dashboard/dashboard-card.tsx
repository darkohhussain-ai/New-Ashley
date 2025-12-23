import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

type DashboardCardProps = {
  title: string
  icon: LucideIcon
  href: string
}

export function DashboardCard({ title, icon: Icon, href }: DashboardCardProps) {
  return (
    <Link href={href} className="group block">
      <Card className="h-48 bg-card/60 backdrop-blur-sm hover:bg-card/90 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-primary/20 border-2 border-transparent hover:border-primary/50">
        <CardContent className="flex flex-col items-center justify-center p-6 text-center h-full">
          <Icon className="w-16 h-16 mb-4 text-primary group-hover:scale-110 transition-transform duration-300" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </CardContent>
      </Card>
    </Link>
  )
}
