'use client'

import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp,
  ArrowDownRight,
  Star,
  Eye,
  Target,
} from 'lucide-react'

// Mock data
const trendingProducts = [
  {
    id: 1,
    name: 'Tokyo Marui MK18 MOD 1',
    type: 'AEG',
    price: 499.99,
    prevPrice: 599.99,
    views: 2341,
    rating: 4.8,
    image: '/mp5.jpg',
    priceChange: -16.7,
    stores: ['Evike', 'AirsoftGI']
  },
  // Add more trending products...
]

const priceDrops = [
  {
    id: 1,
    name: 'VFC MCX',
    type: 'GBBR',
    price: 399.99,
    prevPrice: 549.99,
    dropPercentage: 27.3,
    timeLeft: '2 days',
    store: 'Evike',
    image: '/mp5.jpg'
  },
  // Add more price drops...
]

const hotCategories = [
  {
    name: 'Electric Rifles',
    trend: '+15% searches',
    image: '/mp5.jpg',
    hotItems: ['SSG1', 'MK18', 'MCX']
  },
  // Add more categories...
]

export default function PopularPage() {
  return (
    <div className="min-h-screen bg-zinc-900 pt-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-zinc-800 to-zinc-900 border-b border-zinc-800">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-2">Trending Now</h1>
          <p className="text-zinc-400">
            Discover what&apos;s hot in airsoft right now
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="trending" className="space-y-8">
          <TabsList className="bg-zinc-800/50">
            <TabsTrigger value="trending" className="data-[state=active]:bg-green-600">
              <TrendingUp className="h-4 w-4 mr-2" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="price-drops" className="data-[state=active]:bg-green-600">
              <ArrowDownRight className="h-4 w-4 mr-2" />
              Price Drops
            </TabsTrigger>
            <TabsTrigger value="categories" className="data-[state=active]:bg-green-600">
              <Target className="h-4 w-4 mr-2" />
              Hot Categories
            </TabsTrigger>
          </TabsList>

          {/* Trending Products Tab */}
          <TabsContent value="trending">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingProducts.map((product) => (
                <Link href={`/product/${product.id}`} key={product.id}>
                  <Card className="bg-zinc-800/50 border-zinc-700 hover:border-green-500/50 transition-colors overflow-hidden">
                    <CardContent className="p-0">
                      <div className="relative">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-zinc-900/90 rounded-full px-3 py-1 text-sm">
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {product.views}
                          </div>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">{product.name}</h3>
                            <p className="text-sm text-zinc-400">{product.type}</p>
                          </div>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-500 mr-1" />
                            <span className="text-sm">{product.rating}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-lg font-bold">${product.price}</p>
                            <p className="text-sm text-green-500">
                              {product.priceChange}% this week
                            </p>
                          </div>
                          <p className="text-sm text-zinc-400">
                            {product.stores.length} stores
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>

          {/* Price Drops Tab */}
          <TabsContent value="price-drops">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {priceDrops.map((deal) => (
                <Card key={deal.id} className="bg-zinc-800/50 border-zinc-700">
                  <CardContent className="p-4">
                    <div className="relative mb-4">
                      <img
                        src={deal.image}
                        alt={deal.name}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <div className="absolute top-2 right-2 bg-red-500 text-white rounded-full px-3 py-1 text-sm">
                        -{deal.dropPercentage}%
                      </div>
                    </div>

                    <h3 className="font-semibold mb-2">{deal.name}</h3>
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <p className="text-lg font-bold">${deal.price}</p>
                        <p className="text-sm line-through text-zinc-400">
                          ${deal.prevPrice}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-zinc-400">{deal.store}</p>
                        <p className="text-sm text-red-500">Ends in {deal.timeLeft}</p>
                      </div>
                    </div>

                    <Button className="w-full bg-red-500 hover:bg-red-600">
                      View Deal
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Hot Categories Tab */}
          <TabsContent value="categories">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotCategories.map((category) => (
                <Link href={`/category/${category.name.toLowerCase()}`} key={category.name}>
                  <Card className="bg-zinc-800/50 border-zinc-700 hover:border-green-500/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="relative mb-4">
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg" />
                        <div className="absolute bottom-2 left-2">
                          <h3 className="font-semibold text-lg">{category.name}</h3>
                          <p className="text-sm text-green-500">{category.trend}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm text-zinc-400">Popular items:</p>
                        <div className="flex flex-wrap gap-2">
                          {category.hotItems.map((item) => (
                            <span
                              key={item}
                              className="bg-zinc-700 rounded-full px-3 py-1 text-sm"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}