"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Loader2Icon } from "lucide-react"
import { loginAction } from "@/app/actions/login"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(loginAction, {
    success: false,
  })

  useEffect(() => {
    if (state.success) {
      router.push("/dashboard")
    }
  }, [state.success, router])

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form action={formAction}>
        <FieldGroup>
          <Field className="grid gap-2">
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@nexus.com"
              required
              autoComplete="email"
            />
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="*******"
              required
              autoComplete="current-password"
            />
          </Field>
          {state.error && (
            <p className="text-center text-sm text-destructive">{state.error}</p>
          )}
          <Field>
            <Button
              type="submit"
              className="h-10 w-full rounded-full"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar sesión"
              )}
            </Button>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center">
        Al continuar, aceptas nuestros <a href="#">Términos de Servicio</a> y{" "}
        <a href="#">Política de Privacidad</a>.
      </FieldDescription>
    </div>
  )
}
