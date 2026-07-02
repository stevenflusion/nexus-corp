"use client"

import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface LoadingSkeletonProps {
  rows?: number
}

function LoadingSkeleton({ rows = 6 }: LoadingSkeletonProps) {
  return (
    <div
      data-slot="magic-link-loading-skeleton"
      className="rounded-xl border border-border bg-card shadow-sm"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Estado</TableHead>
            <TableHead>Destinatario</TableHead>
            <TableHead>Rol/Scope</TableHead>
            <TableHead>Creado</TableHead>
            <TableHead>Expira</TableHead>
            <TableHead className="w-[80px]">Usos</TableHead>
            <TableHead className="w-[60px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <Skeleton className="h-5 w-20" />
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-10" />
              </TableCell>
              <TableCell>
                <Skeleton className="size-7 rounded-md" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export { LoadingSkeleton }
export type { LoadingSkeletonProps }
