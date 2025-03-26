'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowRight, Percent } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Product } from '@/types'

// Demo data - would be replaced with API call
const DEMO_FEATURED_DEALS = [
  {
    id: '1',
    name: 'ASG CZ P-09 Suppressor Ready CO2 Airsoft GBB Pistol',
    images: ['/images/asg_p09.jpg'],
    brand: 'ASG',
    category: 'pistol',
    lowestPrice: 134.95,
    wasPrice: 149.99,
    discountPercent: 10,
    stores: [
      { storeName: 'Evike', price: 134.95, inStock: true }
    ]
  },
  {
    id: '3',
    name: 'Elite Force H8R Gen 2 CO2 Airsoft Revolver',
    images: ['/images/h8r_revolver.jpg'],
    brand: 'Elite Force',
    category: 'pistol',
    lowestPrice: 69.95,
    wasPrice: 89.95,
    discountPercent: 22,
    stores: [
      { storeName: 'AirsoftGI', price: 69.95, inStock: true }
    ]
  },
  {
    id: '4',
    name: 'Krytac LVOA-C War Sport M4 Carbine AEG',
    images: ['/images/krytac_lvoa.jpg'],
    brand: 'Krytac',
    category: 'rifle',
    lowestPrice: 359.99,
    wasPrice: 424.99,
    discountPercent: 15,
    stores: [
      { storeName: 'RedWolf Airsoft', price: 359.99, inStock: true }
    ]
  }
];

interface FeaturedDealsProps {
  title?: string;
  subtitle?: string;
  limit?: number;
  className?: string;
}

export function FeaturedDeals({ 
  title = "Featured Deals", 
  subtitle = "Limited-time offers on top airsoft products", 
  limit = 3,
  className = ""
}: FeaturedDealsProps) {
  const [deals, setDeals] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDeals = async () => {
      setIsLoading(true)
      try {
        // In a real app, fetch from your API
        // const response = await fetch('/api/deals/featured')
        // const data = await response.json()
        
        // Using demo data for now
        setTimeout(() => {
          setDeals(DEMO_FEATURED_DEALS as unknown as Product[])
          setIsLoading(false)
        }, 300)
      } catch (error) {
        console.error('Error fetching featured deals:', error)
        setIsLoading(false)
      }
    }

    fetchDeals()
  }, [])

  // Limit the number of deals shown
  const limitedDeals = deals.slice(0, limit)

  return (
    <div className={`${className}`}>
      {/* Header */}
      {(title || subtitle) && (
        <div className="mb-6">
          {title && <h2 className="text-2xl font-bold mb-2">{title}</h2>}
          {subtitle && <p className="text-zinc-400">{subtitle}</p>}
        </div>
      )}

      {/* Deals Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: limit }).map((_, index) => (
            <div key={index} className="bg-zinc-800/50 rounded-lg overflow-hidden">
              <Skeleton className="h-40 w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-6 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {limitedDeals.map((deal) => (
            <Link href={`/product/${deal.id}`} key={deal.id}>
              <div className="bg-zinc-800/50 border border-zinc-700/50 hover:border-green-500/30 rounded-lg overflow-hidden h-full transition-all hover:shadow-md hover:shadow-green-900/5 group">
                {/* Deal Badge */}
                <div className="relative">
                  <div className="absolute top-3 left-3 z-10">
                    <Badge className="bg-green-600 text-white border-none px-2 py-1">
                      <Percent className="h-3 w-3 mr-1" /> 
                      {/* @ts-expect-error - using custom property */}
                      {deal.discountPercent}% OFF
                    </Badge>
                  </div>
                  
                  {/* Product Image */}
                  <div className="relative h-40 bg-gradient-to-br from-zinc-900 to-zinc-800 overflow-hidden">
                    <Image
                      src={deal.images[0] || '/placeholder.jpg'}
                      alt={deal.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      style={{objectFit: 'contain'}}
                      className="p-3 transition-transform group-hover:scale-105 duration-300"
                    />
                  </div>
                </div>
                
                {/* Product Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="bg-zinc-800/70 border-zinc-700 text-xs">
                      {deal.category}
                    </Badge>
                    <span className="text-sm text-zinc-400">{deal.brand}</span>
                  </div>
                  
                  <h3 className="font-medium text-sm md:text-base line-clamp-2 mb-2">
                    {deal.name}
                  </h3>
                  
                  <div className="flex items-end justify-between mt-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-white">${deal.lowestPrice}</span>
                      {/* @ts-expect-error - using custom property */}
                      <span className="text-sm text-zinc-500 line-through">${deal.wasPrice}</span>
                    </div>
                    
                    <Button variant="ghost" size="sm" className="p-0 h-auto text-green-400 hover:text-green-300 hover:bg-transparent">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      
      {/* View All Link */}
      <div className="text-center mt-8">
        <Link href="/deals/weekly-deals">
          <Button variant="outline" className="border-zinc-700">
            View All Deals
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
} 