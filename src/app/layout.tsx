import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { getCurrentUser } from "@/lib/auth";
import { Providers } from "@/components/Providers";
import { ThemeProvider } from "@/components/ThemeProvider";

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
      <body suppressHydrationWarning={true} className="font-body antialiased">
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
