import { LoginForm } from "@/components/login-form"
import { ThemeToggle } from "@/components/theme-toggle"
import { CircleAlertIcon } from "lucide-react"
import Image from "next/image"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ magic_error?: string }>
}) {
  const { magic_error } = await searchParams

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="absolute top-4 left-4">
        <span className="font-medium">Nexus Corp</span>
      </div>
      <Image
        src="/logo.png"
        alt="Nexus Corp"
        width={110}
        height={110}
        className="object-contain"
      />
      <div className="grid gap-4 px-80">
        <h1 className="text-center text-7xl">Inicia sesión en tu cuenta</h1>
        <p className="text-center text-base text-muted-foreground">
          No vendemos promesas. Te damos orientación clara para que tomes
          decisiones financieras con mayor seguridad.
        </p>
      </div>
      {magic_error && (
        <div
          role="alert"
          className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <CircleAlertIcon className="size-4 shrink-0" />
          <span>{magic_error}</span>
        </div>
      )}
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}
