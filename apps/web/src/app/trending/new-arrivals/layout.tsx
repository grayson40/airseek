import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'New Airsoft Arrivals | AirSeek',
  description: 'Discover the latest airsoft products to hit the market. Browse new rifles, pistols, and gear from top manufacturers.',
  openGraph: {
    title: 'New Airsoft Arrivals | AirSeek',
    description: 'Explore the newest airsoft products on the market. Be the first to know about the latest releases.',
    type: 'website',
  },
}

export default function NewArrivalsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
    </>
  )
} 