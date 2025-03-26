'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowRight,
  ArrowDownUp,
  Tag,
  Bell,
  Percent
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Product } from '@/types'

// Sample weekly deals data - replace with real API call
const DEMO_WEEKLY_DEALS = [
  {
    id: '1',
    name: 'ASG CZ P-09 Suppressor Ready CO2 Airsoft GBB Pistol',
    images: ['/images/asg_p09.jpg'],
    brand: 'ASG',
    category: 'pistol',
    type: 'gbb_pistol',
    platform: 'cz',
    fps: { min: 370, max: 380 },
    lowestPrice: 134.95,
    highestPrice: 150,
    discountPercent: 10,
    wasPrice: 149.99,
    stores: [
      { storeName: 'ballahack airsoft', price: 134.95, inStock: true, rating: 4.7 }
    ],
    expiresIn: '2 days'
  },
  {
    id: '2',
    name: 'Lancer Tactical LT-25 Gen 2 M4 SD AEG Rifle',
    images: ['/images/lancer_lt25.jpg'],
    brand: 'Lancer Tactical',
    category: 'rifle',
    type: 'aeg',
    platform: 'm4',
    fps: { min: 380, max: 410 },
    lowestPrice: 179.99,
    highestPrice: 219.99,
    discountPercent: 25,
    wasPrice: 239.99,
    stores: [
      { storeName: 'Evike', price: 179.99, inStock: true, rating: 4.3 }
    ],
    expiresIn: '3 days'
  },
  {
    id: '3',
    name: 'Elite Force H8R Gen 2 CO2 Airsoft Revolver',
    images: ['/images/h8r_revolver.jpg'],
    brand: 'Elite Force',
    category: 'pistol',
    type: 'co2',
    platform: 'revolver',
    fps: { min: 300, max: 330 },
    lowestPrice: 69.95,
    highestPrice: 89.99,
    discountPercent: 22,
    wasPrice: 89.95,
    stores: [
      { storeName: 'AirsoftGI', price: 69.95, inStock: true, rating: 4.8 }
    ],
    expiresIn: '1 day'
  },
  {
    id: '4',
    name: 'Krytac LVOA-C War Sport M4 Carbine AEG',
    images: ['/images/krytac_lvoa.jpg'],
    brand: 'Krytac',
    category: 'rifle',
    type: 'aeg',
    platform: 'm4',
    fps: { min: 380, max: 400 },
    lowestPrice: 359.99,
    highestPrice: 399.99,
    discountPercent: 15,
    wasPrice: 424.99,
    stores: [
      { storeName: 'RedWolf Airsoft', price: 359.99, inStock: true, rating: 4.6 }
    ],
    expiresIn: '5 days'
  },
  {
    id: '5',
    name: 'Tokyo Marui MK23 SOCOM Fixed Slide Gas Pistol',
    images: ['/images/tm_mk23.jpg'],
    brand: 'Tokyo Marui',
    category: 'pistol',
    type: 'gas',
    platform: 'mk23',
    fps: { min: 280, max: 300 },
    lowestPrice: 149.99,
    highestPrice: 179.99,
    discountPercent: 17,
    wasPrice: 179.99,
    stores: [
      { storeName: 'Airsoft Station', price: 149.99, inStock: true, rating: 4.9 }
    ],
    expiresIn: '4 days'
  },
  {
    id: '6',
    name: 'G&G CM16 Raider 2.0 AEG Airsoft Rifle',
    images: ['/images/gg_cm16.jpg'],
    brand: 'G&G',
    category: 'rifle',
    type: 'aeg',
    platform: 'm4',
    fps: { min: 330, max: 350 },
    lowestPrice: 159.99,
    highestPrice: 189.99,
    discountPercent: 20,
    wasPrice: 199.99,
    stores: [
      { storeName: 'Evike', price: 159.99, inStock: true, rating: 4.5 }
    ],
    expiresIn: '6 days'
  }
];

export default function WeeklyDealsPage() {
  const [deals, setDeals] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'discount' | 'price'>('discount')

  // Fetch deals data - replace with real API call in production
  useEffect(() => {
    const fetchDeals = async () => {
      setIsLoading(true)
      try {
        // In a real application, you would fetch from your API
        // const response = await fetch('/api/deals/weekly')
        // const data = await response.json()
        
        // Using demo data for now
        setTimeout(() => {
          setDeals(DEMO_WEEKLY_DEALS as unknown as Product[])
          setIsLoading(false)
        }, 500) // Simulate loading delay
      } catch (error) {
        console.error('Error fetching deals:', error)
        setIsLoading(false)
      }
    }

    fetchDeals()
  }, [])

  // Filter and sort deals
  const filteredDeals = deals.filter(deal => {
    if (filter === 'all') return true
    return deal.category === filter
  })

  const sortedDeals = [...filteredDeals].sort((a, b) => {
    if (sortBy === 'discount') {
      // @ts-expect-error - using our custom properties
      return b.discountPercent - a.discountPercent
    } else {
      return a.lowestPrice - b.lowestPrice
    }
  })

  return (
    <div className="min-h-screen bg-zinc-900 md:pt-20">
      {/* Header Section */}
      <div className="relative overflow-hidden  border-b border-zinc-800">
        <div className="container mx-auto px-4 py-12">
          <div className="relative z-10">
            <Badge variant="outline" className="mb-3 bg-green-900/30 border-green-500/30 text-green-400 px-3 py-1">
              Limited Time
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Weekly Deals</h1>
            <p className="text-zinc-400 max-w-xl mb-6">
              Exclusive discounts on top airsoft products, refreshed every week. Don&apos;t miss these limited-time offers.
            </p>
            <div className="flex gap-2">
              <Button className="bg-green-600 hover:bg-green-700 transition-colors group">
                Subscribe to Alerts <Bell className="ml-2 h-4 w-4 group-hover:animate-pulse" />
              </Button>
              <Button variant="outline" className="border-zinc-700">
                Share Deals
              </Button>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-1/3 h-full opacity-20 bg-gradient-to-l from-green-500/10 to-transparent"></div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-green-500/10 blur-2xl"></div>
        </div>
      </div>

      {/* Filters & Deals Grid */}
      <div className="container mx-auto px-4 py-8">
        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
          <Tabs defaultValue="all" className="w-full md:w-auto" onValueChange={setFilter}>
            <TabsList className="bg-zinc-800/50">
              <TabsTrigger value="all">All Deals</TabsTrigger>
              <TabsTrigger value="rifle">Rifles</TabsTrigger>
              <TabsTrigger value="pistol">Pistols</TabsTrigger>
              <TabsTrigger value="gear">Gear</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs md:text-sm bg-zinc-800/70 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 transition-colors"
              onClick={() => setSortBy(sortBy === 'discount' ? 'price' : 'discount')}
            >
              <ArrowDownUp className="h-3.5 w-3.5 mr-1.5 text-green-400" />
              Sort: {sortBy === 'discount' ? 'Biggest Discount' : 'Lowest Price'}
            </Button>
          </div>
        </div>

        {/* Deals Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-zinc-800/50 rounded-lg overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedDeals.map((deal) => (
              <Link href={`/product/${deal.id}`} key={deal.id}>
                <div className="bg-zinc-800/50 border border-zinc-700/50 hover:border-green-500/30 rounded-lg overflow-hidden flex flex-col h-full transition-all hover:shadow-md hover:shadow-green-900/5 group">
                  {/* Deal Badge */}
                  <div className="relative">
                    <div className="absolute top-4 left-4 z-10">
                      <Badge className="bg-green-600 text-white border-none px-2 py-1">
                        <Percent className="h-3 w-3 mr-1" /> 
                        {/* @ts-expect-error - using our custom property */}
                        {deal.discountPercent}% OFF
                      </Badge>
                    </div>
                    
                    {/* Expires Badge */}
                    <div className="absolute top-4 right-4 z-10">
                      <Badge variant="outline" className="bg-zinc-900/70 border-zinc-700 text-zinc-300">
                        {/* @ts-expect-error - using our custom property */}
                        Ends in {deal.expiresIn}
                      </Badge>
                    </div>
                    
                    {/* Product Image */}
                    <div className="relative h-48 bg-gradient-to-br from-zinc-900 to-zinc-800 overflow-hidden">
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
                  <div className="p-4 flex flex-col flex-grow">
                    <div className="space-y-3 flex-grow">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="bg-zinc-800/70 border-zinc-700 text-xs">
                          {deal.category}
                        </Badge>
                        <span className="text-sm text-zinc-400">{deal.brand}</span>
                      </div>
                      
                      <h3 className="font-medium text-sm md:text-base line-clamp-2">
                        {deal.name}
                      </h3>
                      
                      <div className="flex items-end gap-2">
                        <span className="text-xl font-bold text-white">${deal.lowestPrice}</span>
                        {/* @ts-expect-error - using our custom property */}
                        <span className="text-sm text-zinc-500 line-through">${deal.wasPrice}</span>
                      </div>
                    </div>
                    
                    {/* Store Info */}
                    <div className="mt-4 pt-4 border-t border-zinc-700/50 flex items-center justify-between">
                      <div className="text-sm">
                        <span className="text-zinc-400">at </span>
                        <span className="text-green-400">{deal.stores[0].storeName}</span>
                      </div>
                      
                      <Button variant="ghost" size="sm" className="gap-1 text-green-400 hover:text-green-300 group-hover:bg-green-900/20 hover:translate-x-1 transition-all">
                        View Deal
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-all" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        
        {!isLoading && sortedDeals.length === 0 && (
          <div className="bg-zinc-800/30 rounded-lg p-12 text-center">
            <p className="text-zinc-400 mb-4">No deals found for this category.</p>
            <Button onClick={() => setFilter('all')}>View All Deals</Button>
          </div>
        )}
        
        {/* Pagination or Load More */}
        {!isLoading && sortedDeals.length > 0 && (
          <div className="mt-10 text-center">
            <Button variant="outline" className="border-dashed border-zinc-700 hover:border-green-500/30 px-8">
              Load More Deals
            </Button>
          </div>
        )}
      </div>
      
      {/* Newsletter Section */}
      <div className="bg-zinc-800/50 border-t border-zinc-700/50 mt-12">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <Tag className="h-10 w-10 text-green-400 mb-4" strokeWidth={1.5} />
            <h3 className="text-xl md:text-2xl font-bold mb-3">Never Miss a Deal</h3>
            <p className="text-zinc-400 mb-6">Get weekly alerts about the best airsoft deals delivered straight to your inbox.</p>
            
            <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-4 py-2 rounded-md bg-zinc-900 border border-zinc-700 focus:outline-none focus:border-green-500"
              />
              <Button className="bg-green-600 hover:bg-green-700">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 