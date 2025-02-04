'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Plus, X, Star, ExternalLink } from 'lucide-react'
import type { Product } from '@/types'


// Mock products for comparison
const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Tokyo Marui M4A1',
    brand: 'Tokyo Marui',
    price: 399.99,
    rating: 4.8,
    reviews: 156,
    fps: 280,
    type: 'AEG',
    inStock: true,
    stores: [
      { name: 'Evike', price: 399.99, inStock: true, url: '#' },
      { name: 'AirsoftGI', price: 419.99, inStock: true, url: '#' },
      { name: 'AirsoftMegastore', price: 429.99, inStock: false, url: '#' }
    ],
    specs: {
      weight: '2.9kg',
      length: '840mm',
      magazine: '30 rounds',
      material: 'Reinforced Polymer',
      hopUp: 'Adjustable',
      gearbox: 'Version 2',
      battery: '8.4v NiMH / 7.4v LiPo',
      innerBarrel: '363mm',
      manufacturer: 'Tokyo Marui',
      origin: 'Japan'
    },
    image: '/mp5.jpg'
  },
  {
    id: 2,
    name: 'KWA VM4A1',
    brand: 'KWA',
    price: 329.99,
    rating: 4.5,
    reviews: 120,
    fps: 350,
    type: 'AEG',
    inStock: true,
    stores: [
      { name: 'Evike', price: 329.99, inStock: true, url: '#' },
      { name: 'AirsoftGI', price: 349.99, inStock: true, url: '#' },
      { name: 'AirsoftMegastore', price: 359.99, inStock: false, url: '#' }
    ],
    specs: {
      weight: '2.8kg',
      length: '820mm',
      magazine: '30 rounds',
      material: 'Aluminum',
      hopUp: 'Adjustable',
      gearbox: 'Version 2',
      battery: '9.6v NiMH / 11.1v LiPo',
      innerBarrel: '363mm',
      manufacturer: 'KWA',
      origin: 'Taiwan'
    },
    image: '/mp5.jpg'
  },
  {
    id: 3,
    name: 'VFC Avalon',
    brand: 'VFC',
    price: 449.99,
    rating: 4.9,
    reviews: 200,
    fps: 370,
    type: 'AEG',
    inStock: true,
    stores: [
      { name: 'Evike', price: 449.99, inStock: true, url: '#' },
      { name: 'AirsoftGI', price: 469.99, inStock: true, url: '#' },
      { name: 'AirsoftMegastore', price: 479.99, inStock: false, url: '#' }
    ],
    specs: {
      weight: '3.0kg',
      length: '850mm',
      magazine: '30 rounds',
      material: 'Steel and Polymer',
      hopUp: 'Adjustable',
      gearbox: 'Version 2',
      battery: '8.4v NiMH / 7.4v LiPo',
      innerBarrel: '363mm',
      manufacturer: 'VFC',
      origin: 'China'
    },
    image: '/mp5.jpg'
  },
  {
    id: 4,
    name: 'G&G CM16 Raider',
    brand: 'G&G',
    price: 249.99,
    rating: 4.2,
    reviews: 80,
    fps: 330,
    type: 'AEG',
    inStock: true,
    stores: [
      { name: 'Evike', price: 249.99, inStock: true, url: '#' },
      { name: 'AirsoftGI', price: 259.99, inStock: true, url: '#' },
      { name: 'AirsoftMegastore', price: 269.99, inStock: false, url: '#' }
    ],
    specs: {
      weight: '2.5kg',
      length: '780mm',
      magazine: '450 rounds',
      material: 'Polymer',
      hopUp: 'Adjustable',
      gearbox: 'Version 2',
      battery: '8.4v NiMH',
      innerBarrel: '363mm',
      manufacturer: 'G&G',
      origin: 'Taiwan'
    },
    image: '/mp5.jpg'
  },
  {
    id: 5,
    name: 'Classic Army M4',
    brand: 'Classic Army',
    price: 299.99,
    rating: 4.3,
    reviews: 95,
    fps: 340,
    type: 'AEG',
    inStock: true,
    stores: [
      { name: 'Evike', price: 299.99, inStock: true, url: '#' },
      { name: 'AirsoftGI', price: 309.99, inStock: true, url: '#' },
      { name: 'AirsoftMegastore', price: 319.99, inStock: false, url: '#' }
    ],
    specs: {
      weight: '2.7kg',
      length: '820mm',
      magazine: '300 rounds',
      material: 'Aluminum',
      hopUp: 'Adjustable',
      gearbox: 'Version 2',
      battery: '9.6v NiMH',
      innerBarrel: '363mm',
      manufacturer: 'Classic Army',
      origin: 'Hong Kong'
    },
    image: '/mp5.jpg'
  }
]

export default function ComparePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [showSearch, setShowSearch] = useState(false)

  // Add product to comparison
  const addProduct = (product: Product) => {
    if (products.length < 4 && !products.find(p => p.id === product.id)) {
      setProducts([...products, product])
      setSearchQuery('')
      setSearchResults([])
    }
  }

  // Remove product from comparison
  const removeProduct = (productId: number) => {
    setProducts(products.filter(p => p.id !== productId))
  }

  // Search products
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      const results = mockProducts.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) &&
        !products.find(cp => cp.id === p.id)
      )
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }

  // Get all unique spec keys
  const allSpecs = Array.from(new Set(
    products.flatMap(p => Object.keys(p.specs))
  )).sort()

  return (
    <div className="min-h-screen bg-zinc-900 pt-20">
      {/* Header */}
      <div className="border-b border-zinc-800">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-4">Compare Products</h1>
          <p className="text-zinc-400">
            Compare up to 4 products side by side
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Product Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, index) => {
            const product = products[index]
            return (
              <div key={index} className="relative">
                {product ? (
                  <div className="bg-zinc-800/50 rounded-lg p-4 h-full">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 hover:bg-red-500/20 hover:text-red-500"
                      onClick={() => removeProduct(product.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-40 object-cover rounded-lg mb-4"
                    />
                    <h3 className="font-semibold mb-2">{product.name}</h3>
                    <p className="text-lg font-bold mb-2">${product.price}</p>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="text-sm">{product.rating}</span>
                      <span className="text-xs text-zinc-400 ml-1">({product.reviews})</span>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full h-full min-h-[280px] border-dashed border-2 border-zinc-700 hover:border-green-500"
                    onClick={() => setShowSearch(true)}
                  >
                    <Plus className="h-6 w-6 mr-2" />
                    Add Product
                  </Button>
                )}
              </div>
            )
          })}
        </div>

        {/* Search Dialog */}
        {showSearch && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
            <div className="bg-zinc-900 rounded-lg w-full max-w-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Add Product to Compare</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowSearch(false)
                    setSearchQuery('')
                    setSearchResults([])
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="relative mb-4">
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="bg-zinc-800/50"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
              </div>

              {searchResults.length > 0 && (
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {searchResults.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-4 p-2 hover:bg-zinc-800/50 rounded-lg cursor-pointer"
                        onClick={() => {
                          addProduct(product)
                          setShowSearch(false)
                        }}
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div>
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-sm text-zinc-400">${product.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        )}

        {/* Comparison Table */}
        {products.length > 0 && (
          <div className="bg-zinc-800/50 rounded-lg overflow-hidden">
            {/* Price Comparison */}
            <div className="p-6 border-b border-zinc-700">
              <h2 className="text-xl font-bold mb-4">Price Comparison</h2>
              <div className="space-y-4">
                {products.map(product => (
                  <div key={product.id} className="space-y-2">
                    <h3 className="font-medium">{product.name}</h3>
                    <div className="space-y-2">
                      {product.stores.map(store => (
                        <div
                          key={store.name}
                          className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{store.name}</p>
                            <p className="text-lg font-bold">${store.price}</p>
                          </div>
                          <div className="text-right">
                            <p className={store.inStock ? "text-green-500" : "text-red-500"}>
                              {store.inStock ? "In Stock" : "Out of Stock"}
                            </p>
                            <Button size="sm" className="mt-2" asChild>
                              <a href={store.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Specifications Comparison */}
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Specifications</h2>
              <div className="space-y-4">
                {allSpecs.map(spec => (
                  <div
                    key={spec}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-2 border-b border-zinc-700 last:border-0"
                  >
                    <div className="font-medium text-zinc-400 capitalize">
                      {spec.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    {products.map(product => (
                      <div key={product.id}>
                        {product.specs[spec] || '-'}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-zinc-400 mb-4">
              Add products to start comparing
            </p>
            <Button
              variant="outline"
              className="border-zinc-700"
              onClick={() => setShowSearch(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Product
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}