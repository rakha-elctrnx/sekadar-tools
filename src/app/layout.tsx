import type { Metadata } from "next";
import { DM_Sans, Aleo, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const aleo = Aleo({
  variable: "--font-aleo",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SekadarTools — Developer Tools Collection",
    template: "%s | SekadarTools",
  },
  description:
    "A curated collection of free, fast, and privacy-friendly developer utilities. Encode, decode, format, and transform data right in your browser.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${aleo.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head />
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border/50 py-6">
            <div className="mx-auto max-w-5xl px-4 sm:px-6">
              <p className="text-center text-xs text-muted-foreground">
                Built with ❤️ — All tools run entirely in your browser. No data
                is sent to any server.
              </p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
