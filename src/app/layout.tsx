import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";
import "./features.css";
import "./productivity.css";

export const metadata: Metadata = {
  title: "Orbit Base — Task Operating System",
  description: "A configurable work management, personal execution and analytics platform.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full flex flex-col"><Providers>{children}</Providers></body>
    </html>
  );
}
