import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./atelier.css";
export const metadata: Metadata = {
  title: "Bicou Brincou | Seu ateliê organizado",
  description:
    "Gestão de materiais, produção e vendas de brinquedos artesanais para aves.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bicou Brincou",
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#D95142",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
