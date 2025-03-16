'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, X, ChevronLeft, ChevronRight, Check, Minus, Loader2 } from 'lucide-react'
import type { Product } from '@/types'

// Extended product type for compare view
type CompareProduct = Product & {
    lowestPrice: number;
    highestPrice: number;
    inStock: boolean;
    rating: number;
    reviews: number;
}

// Comparison property type with better typing
type ComparisonProperty = {
    label: string;
    key?: keyof CompareProduct;
    subKey?: string;
    custom?: (product: CompareProduct) => React.ReactNode;
    highlight?: boolean;
}

export default function ComparePageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const productIds = searchParams.get('products')?.split(',') || []
    
    const [products, setProducts] = useState<CompareProduct[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeIndex, setActiveIndex] = useState(0) // For mobile view carousel
    const [showMobileNav, setShowMobileNav] = useState(false)

    useEffect(() => {
        // Show mobile navigation if there are more than 1 product
        const handleResize = () => {
            setShowMobileNav(window.innerWidth < 768 && products.length > 1)
        }

        window.addEventListener('resize', handleResize)
        handleResize()

        return () => window.removeEventListener('resize', handleResize)
    }, [products.length])

    useEffect(() => {
        const fetchProducts = async () => {
            setIsLoading(true)
            try {
                // Fetch products by ID
                const response = await fetch(`/api/products?ids=${productIds.join(',')}`)
                if (!response.ok) {
                    throw new Error('Failed to fetch products')
                }
                const data = await response.json()
                
                // Process data if needed
                setProducts(data)
            } catch (error) {
                console.error('Error fetching products for comparison:', error)
            } finally {
                setIsLoading(false)
            }
        }

        if (productIds.length > 0) {
            fetchProducts()
        } else {
            router.push('/')
        }
    }, [])

    const removeProduct = (productId: string | number) => {
        const newProductIds = productIds.filter(id => id !== productId.toString())
        
        if (newProductIds.length < 2) {
            router.back()
        } else {
            router.push(`/compare?products=${newProductIds.join(',')}`)
        }
    }

    // Navigate through products in mobile view
    const nextProduct = () => {
        setActiveIndex((prev) => (prev === products.length - 1 ? 0 : prev + 1))
    }

    const prevProduct = () => {
        setActiveIndex((prev) => (prev === 0 ? products.length - 1 : prev - 1))
    }

    // Properties to compare
    const comparisonProperties: ComparisonProperty[] = [
        { label: 'Brand', key: 'brand' },
        { label: 'Type', key: 'type' },
        { label: 'Platform', key: 'platform' },
        { 
            label: 'Maximum FPS', 
            custom: (product) => product.fps?.max || 'N/A',
            highlight: true
        },
        { 
            label: 'Price', 
            custom: (product) => 
                product.lowestPrice === product.highestPrice 
                    ? `$${product.lowestPrice}` 
                    : `$${product.lowestPrice} - $${product.highestPrice}`,
            highlight: true
        },
        { 
            label: 'Rating', 
            custom: (product) => product.rating ? `${product.rating}/5` : 'Not rated',
        },
        { 
            label: 'Availability', 
            custom: (product) => product.inStock ? 
                <span className="flex items-center text-green-500"><Check className="h-4 w-4 mr-1" /> In Stock</span> : 
                <span className="flex items-center text-red-500"><Minus className="h-4 w-4 mr-1" /> Out of Stock</span>
        },
        { 
            label: 'Stores', 
            custom: (product) => `${product.stores.length} ${product.stores.length === 1 ? 'store' : 'stores'}`
        },
    ]

    if (isLoading) {
        return (
            <div className="min-h-screen bg-zinc-900 pt-20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            </div>
        )
    }

    // Render a property value safely
    const renderPropertyValue = (product: CompareProduct, prop: ComparisonProperty) => {
        if (prop.custom) {
            return prop.custom(product)
        }
        
        if (prop.key && prop.subKey && typeof product[prop.key] === 'object' && product[prop.key] !== null) {
            const value = (product[prop.key] as Record<string, unknown>)[prop.subKey];
            return value !== undefined && value !== null ? String(value) : 'N/A';
        }
        
        if (prop.key) {
            const value = product[prop.key];
            return value !== undefined && value !== null ? String(value) : 'N/A';
        }
        
        return 'N/A'
    }

    return (
        <div className="min-h-screen bg-zinc-900 md:pt-20">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="mb-4"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to results
                    </Button>
                    
                    <h1 className="text-2xl font-bold mb-2">Compare Products</h1>
                    <p className="text-zinc-400">Comparing {products.length} products</p>
                </div>

                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                    <div className="min-w-max">
                        <div className="grid grid-cols-5 gap-4">
                            {/* Property Labels Column */}
                            <div className="space-y-4">
                                <div className="h-[320px]"></div> {/* Empty space for product images */}
                                
                                {comparisonProperties.map((prop, index) => (
                                    <div 
                                        key={`prop-${index}`} 
                                        className={`px-4 py-4 ${
                                            index % 2 === 0 ? 'bg-zinc-800/30' : 'bg-zinc-800/10'
                                        } ${
                                            prop.highlight ? 'font-semibold text-white' : 'text-zinc-300'
                                        } rounded-l-lg`}
                                    >
                                        {prop.label}
                                    </div>
                                ))}
                            </div>
                            
                            {/* Product Columns */}
                            {products.map((product, productIndex) => (
                                <div key={product.id} className="space-y-4">
                                    <Card className="bg-zinc-800/50 border-zinc-700 h-[320px]">
                                        <CardContent className="p-4 relative">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full bg-zinc-900/50 hover:bg-zinc-900"
                                                onClick={() => removeProduct(product.id)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                            <div className="h-48 mb-4">
                                                <Image 
                                                    src={product.images[0] || ''} 
                                                    alt={product.name}
                                                    className="w-full h-full object-contain rounded-lg"
                                                    width={192}
                                                    height={192}
                                                />
                                            </div>
                                            <h3 className="font-semibold mb-2 line-clamp-2">{product.name}</h3>
                                            <Link href={`/product/${product.id}`}>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="w-full mt-2 border-zinc-700 hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/50"
                                                >
                                                    View Details
                                                </Button>
                                            </Link>
                                        </CardContent>
                                    </Card>
                                    
                                    {/* Property Values */}
                                    {comparisonProperties.map((prop, propIndex) => (
                                        <div 
                                            key={`${product.id}-${propIndex}`} 
                                            className={`px-4 py-4 ${
                                                propIndex % 2 === 0 ? 'bg-zinc-800/30' : 'bg-zinc-800/10'
                                            } ${
                                                prop.highlight ? 'font-semibold text-white' : ''
                                            } ${
                                                productIndex === products.length - 1 ? 'rounded-r-lg' : ''
                                            }`}
                                        >
                                            {renderPropertyValue(product, prop)}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Mobile View */}
                <div className="md:hidden">
                    {/* Mobile Nav */}
                    {showMobileNav && (
                        <div className="flex justify-between items-center mb-4">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="bg-zinc-800 border-zinc-700"
                                onClick={prevProduct}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm text-zinc-400">
                                {activeIndex + 1} of {products.length}
                            </span>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="bg-zinc-800 border-zinc-700"
                                onClick={nextProduct}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                    
                    {/* Product Card */}
                    {products.length > 0 && (
                        <Card className="bg-zinc-800/50 border-zinc-700 mb-6">
                            <CardContent className="p-4 relative">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full bg-zinc-900/50 hover:bg-zinc-900"
                                    onClick={() => removeProduct(products[activeIndex].id)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                                <div className="flex justify-center mb-4">
                                    <div className="h-48 w-48">
                                        <Image 
                                            src={products[activeIndex].images[0] || ''} 
                                            alt={products[activeIndex].name}
                                            className="w-full h-full object-contain rounded-lg"
                                            width={192}
                                            height={192}
                                        />
                                    </div>
                                </div>
                                <h3 className="font-semibold mb-4 text-center">{products[activeIndex].name}</h3>
                                <Link href={`/product/${products[activeIndex].id}`}>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="w-full mt-2 border-zinc-700 hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/50"
                                    >
                                        View Details
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )}

                    {/* Comparison Details */}
                    <div className="space-y-4">
                        {comparisonProperties.map((prop, index) => (
                            <div 
                                key={`mobile-prop-${index}`} 
                                className={`p-4 rounded-lg ${
                                    index % 2 === 0 ? 'bg-zinc-800/30' : 'bg-zinc-800/10'
                                }`}
                            >
                                <div className={`text-sm text-zinc-400 mb-1 ${prop.highlight ? 'font-medium' : ''}`}>
                                    {prop.label}
                                </div>
                                <div className={`${prop.highlight ? 'font-semibold text-white' : ''}`}>
                                    {products.length > 0 ? renderPropertyValue(products[activeIndex], prop) : 'N/A'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
} 