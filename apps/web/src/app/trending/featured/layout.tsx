import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Featured Airsoft Products | AirSeek',
  description: 'Discover the latest and greatest airsoft products. See what\'s trending and what\'s selling.',
  openGraph: {
    title: 'Featured Airsoft Products | AirSeek',
    description: 'Explore the newest airsoft products on the market. Be the first to know about the latest releases.',
    type: 'website',
  },
}

export default function FeaturedLayout({
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