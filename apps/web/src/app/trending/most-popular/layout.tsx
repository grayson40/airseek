import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Most Popular Airsoft Products | AirSeek',
  description: 'Discover the most popular airsoft products on the market. See what\'s trending and what\'s selling.',
  openGraph: {
    title: 'Most Popular Airsoft Products | AirSeek',
    description: 'Explore the most popular airsoft products on the market. Be the first to know about the latest releases.',
    type: 'website',
  },
}

export default function MostPopularLayout({
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