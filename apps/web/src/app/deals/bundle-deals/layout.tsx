import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bundle Airsoft Deals | AirSeek',
  description: 'Exclusive bundle deals on top airsoft products. Find the best discounts, limited-time offers, and special promotions on rifles, pistols, and gear.',
  openGraph: {
    title: 'Bundle Airsoft Deals | AirSeek',
    description: 'Exclusive bundle deals on top airsoft products. Save on rifles, pistols, and gear with limited-time discounts.',
    type: 'website',
  },
}

export default function BundleDealsLayout({
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