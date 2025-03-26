import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Search Airsoft Products | AirSeek',
  description: 'Search for airsoft products. Find the best deals, limited-time offers, and special promotions on rifles, pistols, and gear.',
  openGraph: {
    title: 'Search Airsoft Products | AirSeek',
    description: 'Search for airsoft products. Find the best deals, limited-time offers, and special promotions on rifles, pistols, and gear.',
    type: 'website',
  },
}

export default function SearchLayout({
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