"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Crosshair, Bell, DollarSign, Target, RefreshCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, FormEvent } from 'react'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-zinc-800">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
        </div>
        <div className="relative z-10 container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/10 text-green-500 mb-6">
                <span className="text-sm font-medium">Free Price Comparison</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-500">
                Find the Best Airsoft Deals
              </h1>
              <p className="text-xl text-zinc-400 mb-8 max-w-2xl">
                Compare prices across major retailers instantly. No signup required.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="flex gap-4 max-w-2xl">
                <Input
                  placeholder="Search airsoft products..."
                  className="h-12 bg-zinc-800/50 border-zinc-700"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button type="submit" className="bg-green-600 hover:bg-green-700 h-12 px-8">
                  <Search className="h-5 w-5" />
                </Button>
              </form>
            </div>

            {/* Live Prices Card */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg blur-lg opacity-30"></div>
                <Card className="relative bg-zinc-900/90 border-zinc-800">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Live Prices</h3>
                    <div className="space-y-4">
                      {[
                        { name: 'Tokyo Marui M4A1', price: '$399.99', store: 'Evike' },
                        { name: 'KWA VM4A1', price: '$329.99', store: 'AirsoftGI' },
                        { name: 'VFC Avalon', price: '$449.99', store: 'AirsoftMegastore' }
                      ].map((item) => (
                        <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                              <Target className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                              <p className="text-sm text-zinc-400">{item.name}</p>
                              <div className="flex items-center gap-2">
                                <p className="text-lg font-semibold">{item.price}</p>
                                <span className="text-xs text-zinc-500">{item.store}</span>
                              </div>
                            </div>
                          </div>
                          <Link href={`/product/${item.name.toLowerCase().replace(/\s+/g, '-')}`}>
                            <Button size="sm" variant="outline" className="border-green-600">
                              View
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Features Banner */}
      <section className="bg-green-600">
        <div className="container mx-auto px-4 py-3 text-center">
          <p className="text-black">
            Want price drop alerts?
            <Button variant="link" className="text-black font-semibold ml-2">
              Upgrade to Premium
            </Button>
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-zinc-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-4xl font-bold text-green-500">50K+</p>
              <p className="text-zinc-400">Daily Prices</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-green-500">15+</p>
              <p className="text-zinc-400">Retailers</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-green-500">24/7</p>
              <p className="text-zinc-400">Updates</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-green-500">100%</p>
              <p className="text-zinc-400">Free</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-zinc-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Advanced Features</h2>
            <p className="text-xl text-zinc-400">Upgrade to access premium tools</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-zinc-900/50 border-zinc-800 hover:border-green-500/50 transition-colors">
                <CardContent className="p-6">
                  <feature.icon className="w-8 h-8 mb-4 text-green-500" />
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-zinc-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-zinc-900 border-t border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold mb-4">Compare</h3>
              <ul className="space-y-2 text-zinc-400">
                <li>Popular Items</li>
                <li>New Arrivals</li>
                <li>Deals</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Premium</h3>
              <ul className="space-y-2 text-zinc-400">
                <li>Features</li>
                <li>Pricing</li>
                <li>API</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-zinc-800 text-center text-zinc-400">
            <p>{`© ${new Date().getFullYear()} Volare Solutions LLC. All rights reserved.`}</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

const features = [
  {
    icon: Bell,
    title: 'Price Alerts',
    description: 'Get notified when prices drop to your target'
  },
  {
    icon: Crosshair,
    title: 'Stock Alerts',
    description: 'Never miss a restock on your wishlist items'
  },
  {
    icon: DollarSign,
    title: 'Price History',
    description: 'View historical prices to make informed decisions'
  },
  {
    icon: Target,
    title: 'Deal Scores',
    description: 'AI-powered deal ratings and recommendations'
  },
  {
    icon: RefreshCcw,
    title: 'Auto-refresh',
    description: '24/7 automated price and stock monitoring'
  }
];