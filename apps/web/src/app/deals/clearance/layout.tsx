import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Clearance Airsoft Deals | AirSeek',
  description: 'Exclusive clearance deals on top airsoft products. Find the best discounts, limited-time offers, and special promotions on rifles, pistols, and gear.',
  openGraph: {
    title: 'Clearance Airsoft Deals | AirSeek',
    description: 'Exclusive clearance deals on top airsoft products. Save on rifles, pistols, and gear with limited-time discounts.',
    type: 'website',
  },
}

export default function ClearanceDealsLayout({
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