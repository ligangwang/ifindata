import type { Metadata } from "next";
import { IBM_Plex_Sans, Sora } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import { EnvironmentBanner } from "@/components/environment-banner";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "IFinData Web",
  description: "Web-first financial knowledge graph for public company and business model research.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${ibmPlexSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppProviders>
          <EnvironmentBanner />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
