import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";

export const metadata: Metadata = {
  title: "DinoPay",
  description: "Gestion de pagos y microcreditos para unidades de cobro"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
