import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { getCurrentUser } from "@/lib/auth";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en">
      <body suppressHydrationWarning={true} className={`${inter.className} bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 antialiased`}>
        <Providers>
          {user ? (
            <div className="flex">
              <Sidebar user={user} />
              <main className="flex-1 md:ml-72 min-h-screen p-4 md:p-8 pt-20 md:pt-8">
                {children}
              </main>
            </div>
          ) : (
            <main className="min-h-screen">
              {children}
            </main>
          )}
        </Providers>
      </body>
    </html>
  );
}
