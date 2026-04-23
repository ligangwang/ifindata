import type { Metadata } from "next";
import { IBM_Plex_Sans, Sora } from "next/font/google";
import Link from "next/link";
import Script from "next/script";
import { AppProviders } from "@/components/providers/app-providers";
import { EnvironmentBanner } from "@/components/environment-banner";
import { SiteNav } from "@/components/site-nav";
import "./globals.css";

const GOOGLE_ANALYTICS_ID = process.env.GOOGLE_ANALYTICS_ID;

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
  title: "YouAnalyst | You are the analyst. Your watchlist. Your track record.",
  description: "Make public market calls, track your score, and build your analyst reputation.",
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
        {GOOGLE_ANALYTICS_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){window.dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GOOGLE_ANALYTICS_ID}');
              `}
            </Script>
          </>
        ) : null}
        <AppProviders>
          <EnvironmentBanner />
          <SiteNav />
          <div className="flex-1">{children}</div>
          <footer className="border-t border-white/10 bg-slate-950/80">
            <div className="mx-auto w-full max-w-6xl px-4 py-4 text-center text-xs leading-6 text-slate-400">
              Predictions, rankings, and commentary on YouAnalyst are provided for informational purposes only and do
              not constitute financial, investment, legal, or tax advice. Always do your own research before making
              investment decisions.
              <div className="mt-3">
                <Link href="/feedback" className="font-medium text-cyan-200 underline-offset-2 hover:underline">
                  Share thoughts
                </Link>
              </div>
              <p className="mt-2 text-slate-500">Copyright {new Date().getFullYear()} YouAnalyst. All rights reserved.</p>
            </div>
          </footer>
        </AppProviders>
      </body>
    </html>
  );
}
