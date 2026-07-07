"use client"

import * as React from "react"
import { QRCodeSVG } from "qrcode.react"
import { DownloadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface QrCodeDisplayProps {
  url: string
  size?: number
}

function QrCodeDisplay({ url, size = 192 }: QrCodeDisplayProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  const handleDownload = () => {
    const svg = document.querySelector<SVGSVGElement>(
      '[data-slot="qr-code-display"] svg'
    )
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      canvas.width = size * 2
      canvas.height = size * 2
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      canvas.toBlob((blob) => {
        if (!blob) return
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = "magic-link-qr.png"
        link.click()
        URL.revokeObjectURL(link.href)
      })
    }
    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)))
  }

  return (
    <div
      data-slot="qr-code-display"
      className="flex flex-col items-center gap-4"
    >
      <div className="rounded-xl border-2 border-border bg-white p-4">
        <QRCodeSVG
          value={url}
          size={size}
          level="M"
          includeMargin
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleDownload}
      >
        <DownloadIcon />
        Descargar QR
      </Button>
    </div>
  )
}

export { QrCodeDisplay }
export type { QrCodeDisplayProps }