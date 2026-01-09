import type { Metadata } from "next"
import { Space_Grotesk } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { BottomNav } from "@/components/bottom-nav"
import { SetsProvider } from "@/providers/sets-provider"

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Sets",
  description: "Track workout sets with local-first storage.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} font-sans antialiased`}>
        <SetsProvider>
          <div className="bg-background text-foreground min-h-screen">
            <div className="bg-[radial-gradient(1200px_circle_at_top,_#f5f5f4,_#ffffff_60%)]">
              <div className="mx-auto w-full max-w-[480px] px-4 pb-24 pt-6">
                {children}
              </div>
            </div>
            <BottomNav />
          </div>
          <Toaster position="top-center" richColors />
        </SetsProvider>
      </body>
    </html>
  )
}
