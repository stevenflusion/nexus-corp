import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Nexus Corp Admin Panel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
