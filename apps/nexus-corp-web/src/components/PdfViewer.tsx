import { useState } from "react"
import { PDFViewer } from "@embedpdf/react-pdf-viewer"

interface Props {
  src: string
  title?: string
}

function Skeleton() {
  return (
    <div className="flex h-full w-full animate-pulse flex-col items-center bg-[var(--nexus-cream)] px-8 py-10">
      <div className="flex w-full max-w-[210mm] flex-col gap-5 rounded-sm border border-[var(--nexus-line)] bg-[var(--nexus-paper)] p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-4 w-32 rounded-md bg-[var(--nexus-line)]/50" />
          <div className="h-4 w-48 rounded-md bg-[var(--nexus-line)]/30" />
        </div>
        {[100, 85, 75, 90, 65, 80, 70, 100, 75, 60, 85, 70].map((w, i) => (
          <div
            key={i}
            className="h-3 rounded-md"
            style={{
              width: `${w}%`,
              backgroundColor: `var(--nexus-line)`,
              opacity: i % 2 === 0 ? 0.4 : 0.3,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default function PdfViewer({ src, title }: Props) {
  const [ready, setReady] = useState(false)

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12">
      {title && (
        <h1 className="text-3xl font-bold text-[var(--nexus-blue)]">
          {title}
        </h1>
      )}
      <div className="relative h-[88vh] w-full overflow-hidden rounded-lg border border-[var(--nexus-line)] shadow-[var(--nexus-shadow)]">
        {!ready && (
          <div className="absolute inset-0 z-10">
            <Skeleton />
          </div>
        )}
        <PDFViewer
          config={{ src }}
          className="h-full w-full"
          onReady={() => setReady(true)}
        />
      </div>
    </div>
  )
}
