import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TruthLens — AI Content Validator",
  description: "Validate any link or screenshot against trusted sources instantly.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${geist.className} min-h-full flex flex-col`}>
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
