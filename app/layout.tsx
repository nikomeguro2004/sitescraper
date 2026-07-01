import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fontHeading = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SiteElevate — Website Audit & Optimization",
  description: "Expert analysis of your website's design, branding, trust, and conversion performance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html
        lang="en"
        className={`${fontSans.variable} ${fontHeading.variable} h-full antialiased dark`}
      >
        <body className="min-h-full flex flex-col font-sans">
          <TooltipProvider delay={200}>
            {children}
            <Toaster />
          </TooltipProvider>
        </body>
    </html>
  );
}
