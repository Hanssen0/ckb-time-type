import { Providers } from "@/components/Providers";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CKB Time Type Dashboard",
  description: "Monitor and discover CKB Time Type cell groups",
  icons:
    "https://raw.githubusercontent.com/Hanssen0/ckb-cto/refs/heads/main/docs/logo.svg",
  openGraph: {
    title: "CKB Time Type Dashboard",
    description: "Monitor and discover CKB Time Type cell groups",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
