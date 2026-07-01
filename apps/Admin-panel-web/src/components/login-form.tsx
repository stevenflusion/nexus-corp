"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [error, setError] = useState("")

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")

    const form = new FormData(e.currentTarget)
    const email = form.get("email") as string
    const password = form.get("password") as string

    if (email === "admin" && password === "admin") {
      router.push("/dashboard")
    } else {
      setError("Credenciales inválidas")
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <Field className="grid gap-2">
            <Input
              id="email"
              name="email"
              type="text"
              placeholder="admin@nexus.com"
              required
            />
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="*******"
              required
            />
          </Field>
          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}
          <Field>
            <Button type="submit" className="h-10 w-full rounded-full">
              Iniciar sesión
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
