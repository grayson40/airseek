import type { Metadata } from 'next'

type Props = Promise<{ id: string }>;

export async function generateMetadata(props: { params: Props }): Promise<Metadata> {
  const { id } = await props.params;
  const product = id.charAt(0).toUpperCase() + id.slice(1)
  
  return {
    title: `${product} | AirSeek`,
    description: `Explore the latest and greatest airsoft ${product} products. Find the best deals, limited-time offers, and special promotions on rifles, pistols, and gear.`,
    openGraph: {
      title: `${product} | AirSeek`,
      description: `Explore the latest and greatest airsoft ${product} products. Find the best deals, limited-time offers, and special promotions on rifles, pistols, and gear.`,
      type: 'website',
    },
  }
}

export default function ProductLayout({
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