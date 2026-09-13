import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";
import "./features.css";

export const metadata: Metadata = {
  title: "Orbit Base — HR Operations",
  description: "A flexible internal work management platform for teams and operations.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full flex flex-col"><Providers>{children}</Providers></body>
    </html>
  );
}
