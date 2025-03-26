'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowRight,
  ArrowDownUp,
  Star,
  Clock,
  Sparkles
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Product } from '@/types'

// Sample new arrivals data - replace with real API call
const DEMO_NEW_ARRIVALS = [
  {
    id: '101',
    name: 'Elite Force GLOCK 19X CO2 Blowback Airsoft Pistol',
    images: ['/images/glock_19x.jpg'],
    brand: 'Elite Force',
    category: 'pistol',
    type: 'gbb_pistol',
    platform: 'glock',
    fps: { min: 300, max: 330 },
    lowestPrice: 169.99,
    stores: [
      { storeName: 'Evike', price: 169.99, inStock: true, rating: 4.5 }
    ],
    addedDate: '2023-11-01',
    daysAgo: 2
  },
  {
    id: '102',
    name: 'Specna Arms EDGE 2.0 SA-E14 M4 AEG Rifle',
    images: ['/images/specna_edge.jpg'],
    brand: 'Specna Arms',
    category: 'rifle',
    type: 'aeg',
    platform: 'm4',
    fps: { min: 370, max: 410 },
    lowestPrice: 249.99,
    stores: [
      { storeName: 'RedWolf Airsoft', price: 249.99, inStock: true, rating: 4.7 }
    ],
    addedDate: '2023-10-29',
    daysAgo: 5
  },
  {
    id: '103',
    name: 'Tokyo Marui MTR16 Gen 3 NGRS AEG Rifle',
    images: ['/images/tm_mtr16.jpg'],
    brand: 'Tokyo Marui',
    category: 'rifle',
    type: 'aeg',
    platform: 'm4',
    fps: { min: 280, max: 300 },
    lowestPrice: 599.99,
    stores: [
      { storeName: 'Airsoft Station', price: 599.99, inStock: true, rating: 4.9 }
    ],
    addedDate: '2023-10-27',
    daysAgo: 7
  },
  {
    id: '104',
    name: 'PTS EPM1-S Enhanced Polymer Magazine for M4/AR15',
    images: ['/images/pts_epm.jpg'],
    brand: 'PTS Syndicate',
    category: 'gear',
    type: 'magazine',
    platform: 'm4',
    lowestPrice: 24.95,
    stores: [
      { storeName: 'AirsoftGI', price: 24.95, inStock: true, rating: 4.8 }
    ],
    addedDate: '2023-10-25',
    daysAgo: 9
  },
  {
    id: '105',
    name: 'KWA QRF MOD 3 AEG Rifle',
    images: ['/images/kwa_qrf.jpg'],
    brand: 'KWA',
    category: 'rifle',
    type: 'aeg',
    platform: 'm4',
    fps: { min: 350, max: 380 },
    lowestPrice: 319.99,
    stores: [
      { storeName: 'Evike', price: 319.99, inStock: true, rating: 4.6 }
    ],
    addedDate: '2023-10-22',
    daysAgo: 12
  },
  {
    id: '106',
    name: 'Condor Tactical Rush 72 Backpack',
    images: ['/images/condor_rush.jpg'],
    brand: 'Condor',
    category: 'gear',
    type: 'backpack',
    lowestPrice: 89.95,
    stores: [
      { storeName: 'Airsoft Megastore', price: 89.95, inStock: true, rating: 4.4 }
    ],
    addedDate: '2023-10-20',
    daysAgo: 14
  }
];

export default function NewArrivalsPage() {
  const [newProducts, setNewProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'price'>('newest')

  // Fetch new arrivals data - replace with real API call in production
  useEffect(() => {
    const fetchNewArrivals = async () => {
      setIsLoading(true)
      try {
        // In a real application, you would fetch from your API
        // const response = await fetch('/api/trending/new-arrivals')
        // const data = await response.json()
        
        // Using demo data for now
        setTimeout(() => {
          setNewProducts(DEMO_NEW_ARRIVALS as unknown as Product[])
          setIsLoading(false)
        }, 500) // Simulate loading delay
      } catch (error) {
        console.error('Error fetching new arrivals:', error)
        setIsLoading(false)
      }
    }

    fetchNewArrivals()
  }, [])

  // Filter and sort products
  const filteredProducts = newProducts.filter(product => {
    if (filter === 'all') return true
    return product.category === filter
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'newest') {
      // @ts-expect-error - using our custom properties
      return a.daysAgo - b.daysAgo
    } else {
      return a.lowestPrice - b.lowestPrice
    }
  })

  return (
    <div className="min-h-screen bg-zinc-900 md:pt-20">
      {/* Header Section */}
      <div className="relative overflow-hidden border-b border-zinc-800">
        <div className="container mx-auto px-4 py-12">
          <div className="relative z-10">
            <Badge variant="outline" className="mb-3 bg-indigo-900/30 border-indigo-500/30 text-indigo-400 px-3 py-1">
              Featured Products
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Featured Products</h1>
            <p className="text-zinc-400 max-w-xl mb-6">
              Discover the latest and greatest airsoft products. See what&apos;s trending and what&apos;s selling.
            </p>
            <div className="flex gap-2">
              <Button className="bg-indigo-600 hover:bg-indigo-700 transition-colors group">
                Subscribe to Updates <Star className="ml-2 h-4 w-4 group-hover:animate-pulse" />
              </Button>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-1/3 h-full opacity-20 bg-gradient-to-l from-indigo-500/10 to-transparent"></div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-indigo-500/10 blur-2xl"></div>
        </div>
      </div>

      {/* Filters & Products Grid */}
      <div className="container mx-auto px-4 py-8">
        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
          <Tabs defaultValue="all" className="w-full md:w-auto" onValueChange={setFilter}>
            <TabsList className="bg-zinc-800/50">
              <TabsTrigger value="all">All Products</TabsTrigger>
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
              onClick={() => setSortBy(sortBy === 'newest' ? 'price' : 'newest')}
            >
              <ArrowDownUp className="h-3.5 w-3.5 mr-1.5 text-indigo-400" />
              Sort: {sortBy === 'newest' ? 'Most Recent' : 'Lowest Price'}
            </Button>
          </div>
        </div>

        {/* Products Grid */}
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
            {sortedProducts.map((product) => (
              <Link href={`/product/${product.id}`} key={product.id}>
                <div className="bg-zinc-800/50 border border-zinc-700/50 hover:border-indigo-500/30 rounded-lg overflow-hidden flex flex-col h-full transition-all hover:shadow-md hover:shadow-indigo-900/5 group">
                  {/* New Badge */}
                  <div className="relative">
                    <div className="absolute top-4 left-4 z-10">
                      <Badge className="bg-indigo-600 text-white border-none px-2 py-1">
                        <Sparkles className="h-3 w-3 mr-1" /> 
                        New
                      </Badge>
                    </div>
                    
                    {/* Added Date Badge */}
                    <div className="absolute top-4 right-4 z-10">
                      <Badge variant="outline" className="bg-zinc-900/70 border-zinc-700 text-zinc-300">
                        {/* @ts-expect-error - using our custom property */}
                        {product.daysAgo === 0 ? 'Today' : product.daysAgo === 1 ? 'Yesterday' : `${product.daysAgo} days ago`}
                      </Badge>
                    </div>
                    
                    {/* Product Image */}
                    <div className="relative h-48 bg-gradient-to-br from-zinc-900 to-zinc-800 overflow-hidden">
                      <Image
                        src={product.images[0] || '/placeholder.jpg'}
                        alt={product.name}
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
                          {product.category}
                        </Badge>
                        <span className="text-sm text-zinc-400">{product.brand}</span>
                      </div>
                      
                      <h3 className="font-medium text-sm md:text-base line-clamp-2">
                        {product.name}
                      </h3>
                      
                      <div className="flex items-end gap-2">
                        <span className="text-xl font-bold text-white">${product.lowestPrice}</span>
                      </div>
                    </div>
                    
                    {/* Store Info */}
                    <div className="mt-4 pt-4 border-t border-zinc-700/50 flex items-center justify-between">
                      <div className="text-sm">
                        <span className="text-zinc-400">at </span>
                        <span className="text-indigo-400">{product.stores[0].storeName}</span>
                      </div>
                      
                      <Button variant="ghost" size="sm" className="gap-1 text-indigo-400 hover:text-indigo-300 group-hover:bg-indigo-900/20 hover:translate-x-1 transition-all">
                        View Product
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-all" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        
        {!isLoading && sortedProducts.length === 0 && (
          <div className="bg-zinc-800/30 rounded-lg p-12 text-center">
            <p className="text-zinc-400 mb-4">No new products found for this category.</p>
            <Button onClick={() => setFilter('all')}>View All Products</Button>
          </div>
        )}
        
        {/* Pagination or Load More */}
        {!isLoading && sortedProducts.length > 0 && (
          <div className="mt-10 text-center">
            <Button variant="outline" className="border-dashed border-zinc-700 hover:border-indigo-500/30 px-8">
              Load More Products
            </Button>
          </div>
        )}
      </div>
      
      {/* Newsletter Section */}
      <div className="bg-zinc-800/50 border-t border-zinc-700/50 mt-12">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <Clock className="h-10 w-10 text-indigo-400 mx-auto mb-4" strokeWidth={1.5} />
            <h3 className="text-xl md:text-2xl font-bold mb-3">Stay Ahead of the Curve</h3>
            <p className="text-zinc-400 mb-6">Be the first to know when new airsoft products are added to our database.</p>
            
            <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-4 py-2 rounded-md bg-zinc-900 border border-zinc-700 focus:outline-none focus:border-indigo-500"
              />
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 