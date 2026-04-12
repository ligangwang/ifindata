import type { Metadata } from "next";
import { IBM_Plex_Sans, Sora } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import { EnvironmentBanner } from "@/components/environment-banner";
import { SiteNav } from "@/components/mvp/site-nav";
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
  title: "IFinData - Prediction Market MVP",
  description: "Publish stock predictions, settle outcomes, and climb the analyst leaderboard.",
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
          <SiteNav />
          <div className="flex-1">{children}</div>
          <footer className="border-t border-white/10 bg-slate-950/80">
            <div className="mx-auto w-full max-w-6xl px-4 py-4 text-center text-xs leading-6 text-slate-400">
              Predictions, rankings, and commentary on iFinData are provided for informational purposes only and do
              not constitute financial, investment, legal, or tax advice. Always do your own research before making
              investment decisions.
              <p className="mt-2 text-slate-500">Copyright {new Date().getFullYear()} iFinData. All rights reserved.</p>
            </div>
          </footer>
        </AppProviders>
      </body>
    </html>
  );
}
