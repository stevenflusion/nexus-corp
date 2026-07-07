import Link from "next/link"
import {
  LayoutDashboardIcon,
  Link2Icon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

type SectionCard = {
  title: string
  description: string
  href: string
  icon: LucideIcon
}

const sections: SectionCard[] = [
  {
    title: "Dashboard",
    description: "Vista general del panel de administración.",
    href: "/dashboard",
    icon: LayoutDashboardIcon,
  },
  {
    title: "Magic Links",
    description: "Gestioná los links de acceso para administradores, brand managers, desarrolladores y externos.",
    href: "/dashboard/magic-links",
    icon: Link2Icon,
  },
  {
    title: "Leads",
    description: "Visualizá y gestioná los leads registrados en el sistema.",
    href: "/dashboard/leads",
    icon: UsersIcon,
  },
]

export default function AllAccessPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div>
        <h1 className="text-2xl font-bold">Acceso total</h1>
        <p className="text-sm text-muted-foreground">
          Tenés acceso a todas las secciones del panel. Elegí a dónde querés ir.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group flex flex-col gap-3 rounded-xl border-2 border-border p-5 transition-all hover:border-primary hover:bg-muted/50"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <section.icon className="size-5" />
            </div>
            <div>
              <p className="font-medium">{section.title}</p>
              <p className="text-sm text-muted-foreground">
                {section.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}