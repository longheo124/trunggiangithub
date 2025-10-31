import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GitHub Content Bridge",
  description:
    "Manage GitHub repository files directly from a Vercel-hosted interface."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-10">
          {children}
        </div>
      </body>
    </html>
  );
}
