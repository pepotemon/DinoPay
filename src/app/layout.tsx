import type { Metadata } from "next";
import { Suspense } from "react";
import { Toaster } from "sonner";
import "./globals.css";
import { AutoToast } from "@/components/auto-toast";
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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#16a34a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="DinoPay" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>
        <QueryProvider>{children}</QueryProvider>
        <Toaster position="top-center" richColors />
        <Suspense>
          <AutoToast />
        </Suspense>
      </body>
    </html>
  );
}
