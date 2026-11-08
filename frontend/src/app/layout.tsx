import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orchestra AI | Neural Command Center",
  description: "Autonomous multi-agent digital workforce orchestration",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased bg-[#050811] text-slate-100">
        {children}
      </body>
    </html>
  );
}

