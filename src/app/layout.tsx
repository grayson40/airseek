import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Navbar } from "@/components/navbar"
import { PostHogProvider } from './providers'
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AirSeek - Airsoft Price Comparison",
  description: "Track and compare airsoft prices across major retailers",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
        <body className={`${inter.className} bg-zinc-900 text-gray-100`}>
          <Navbar />
          <PostHogProvider>
            <main className="pt-20 md:pt-0">
              {children}
            </main>
          </PostHogProvider>
        </body>
    </html>
  )
}