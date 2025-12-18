import type { Metadata } from "next";
import { Inter, Chakra_Petch, Rajdhani } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { getCurrentUser } from "@/lib/auth";
import { Providers } from "@/components/Providers";
import { ThemeProvider } from "@/components/ThemeProvider";

// Optimized font loading with next/font
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const chakraPetch = Chakra_Petch({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-chakra-petch",
  display: "swap",
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-rajdhani",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Comprint Operations",
  description: "Internal operations portal",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Flash prevention script - runs before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'system';
                  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const isDark = theme === 'dark' || (theme === 'system' && systemDark);
                  document.documentElement.classList.toggle('dark', isDark);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning={true} className={`${inter.variable} ${chakraPetch.variable} ${rajdhani.variable} font-body antialiased`}>
        <ThemeProvider>
          <Providers>
            {user ? (
              <div className="flex min-h-screen bg-background">
                <Sidebar user={user} />
                <main className="flex-1 md:ml-72 min-h-screen p-4 md:p-8 pt-20 md:pt-8">
                  {children}
                </main>
              </div>
            ) : (
              <main className="min-h-screen bg-background">
                {children}
              </main>
            )}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
