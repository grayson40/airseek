import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Weekly Airsoft Deals | AirSeek',
  description: 'Exclusive weekly deals on top airsoft products. Find the best discounts, limited-time offers, and special promotions on rifles, pistols, and gear.',
  openGraph: {
    title: 'Weekly Airsoft Deals | AirSeek',
    description: 'Exclusive weekly deals on top airsoft products. Save on rifles, pistols, and gear with limited-time discounts.',
    type: 'website',
  },
}

export default function WeeklyDealsLayout({
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