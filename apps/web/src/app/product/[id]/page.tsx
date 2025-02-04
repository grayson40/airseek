'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
    ExternalLink,
    Bell,
    ArrowLeft,
    TrendingUp,
    Info,
    Heart,
    Share,
} from 'lucide-react'
import { PriceChart } from "@/components/price-chart"
import Link from 'next/link'
import { Product } from '@/types'

export default function ProductPage() {
    const params = useParams()
    const [product, setProduct] = useState<Product | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [selectedImage, setSelectedImage] = useState(0)
    const [showZoom, setShowZoom] = useState(false)
    const [priceAlertOpen, setPriceAlertOpen] = useState(false)
    const [targetPrice, setTargetPrice] = useState('')

    // Fetch product data from the API
    useEffect(() => {
        const fetchProduct = async () => {
            setIsLoading(true)
            try {
                const response = await fetch(`/api/prices/${params.id}`)
                if (!response.ok) {
                    throw new Error('Failed to fetch product')
                }
                const data = await response.json()
                if (!data) {
                    throw new Error('Product not found')
                }
                setProduct(data)
            } catch (error) {
                console.error('Error fetching product:', error)
                toast.error('Product not found or an error occurred while fetching.')
            } finally {
                setIsLoading(false)
            }
        }

        if (params.id) {
            fetchProduct()
        }
    }, [params.id])

    if (isLoading) {
        return (
            <ProductSkeleton />
        )
    }

    if (!product) {
        return <div className="text-center">Product not found</div>
    }

    // Price alert handler
    const handlePriceAlert = () => {
        if (!targetPrice) return

        toast.success('Price alert set successfully!')
        setPriceAlertOpen(false)
        setTargetPrice('')
    }

    // Image zoom handler
    const handleImageZoom = (index: number) => {
        setSelectedImage(index)
        setShowZoom(true)
    }

    // Share handler
    const handleShare = async () => {
        try {
            await navigator.share({
                title: product.name,
                url: window.location.href
            })
        } catch (err) {
            // Fallback to copy link
            navigator.clipboard.writeText(window.location.href)
            toast.success('Link copied to clipboard!')
            console.error(err);
        }
    }

    // Add to favorites handler
    const handleAddToFavorites = () => {
        toast.success('Added to favorites!')
    }

    return (
        <div className="min-h-screen bg-zinc-900 md:pt-20">
            {/* Back Navigation */}
            <div className="container mx-auto px-4 py-4">
                <Link href="/search" className="text-zinc-400 hover:text-green-500 inline-flex items-center">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Search
                </Link>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Product Header with Image Gallery */}
                <div className="mb-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
                        {/* Image Gallery */}
                        <div className="space-y-4">
                            <div
                                className="bg-zinc-800/50 rounded-lg overflow-hidden cursor-zoom-in"
                                onClick={() => handleImageZoom(selectedImage)}
                            >
                                <img
                                    src={product.images[selectedImage]}
                                    alt={product.name || 'Product Name Not Available'}
                                    className="w-full h-[400px] object-cover"
                                />
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {product.images.map((img, i) => (
                                    <div
                                        key={i}
                                        className={`bg-zinc-800/50 rounded-lg overflow-hidden cursor-pointer 
                                            ${selectedImage === i ? 'ring-2 ring-green-500' : ''}`}
                                        onClick={() => setSelectedImage(i)}
                                    >
                                        <img
                                            src={img}
                                            alt={`${product.name || 'Product Name Not Available'} ${i + 1}`}
                                            className="w-full h-24 object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Product Info */}
                        <div>
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h1 className="text-3xl font-bold mb-2">{product.name || 'Product Name Not Available'}</h1>
                                    <div className="flex items-center gap-4 text-sm text-zinc-400">
                                        <span>Brand: {product.brand}</span>
                                        <span>Type: {product.type.toUpperCase()}</span>
                                        <span>FPS: {product.fps.min}-{product.fps.max}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleShare}
                                    >
                                        <Share className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleAddToFavorites}
                                    >
                                        <Heart className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Price Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                <div className="bg-zinc-800/50 rounded-lg p-4">
                                    <p className="text-sm text-zinc-400">Lowest Price</p>
                                    <p className="text-xl font-bold">${product.lowestPrice}</p>
                                </div>
                                <div className="bg-zinc-800/50 rounded-lg p-4">
                                    <p className="text-sm text-zinc-400">Highest Price</p>
                                    <p className="text-xl font-bold">${product.highestPrice}</p>
                                </div>
                                <div className="bg-zinc-800/50 rounded-lg p-4">
                                    <p className="text-sm text-zinc-400">Average Price</p>
                                    <p className="text-xl font-bold">${(product.highestPrice + product.lowestPrice) / 2}</p>
                                </div>
                                <div className="bg-zinc-800/50 rounded-lg p-4">
                                    <p className="text-sm text-zinc-400">Popularity</p>
                                    <p className="text-xl font-bold">{product.popularity} views</p>
                                </div>
                            </div>

                            {/* Price Alert Button */}
                            <Dialog open={priceAlertOpen} onOpenChange={setPriceAlertOpen}>
                                <DialogTrigger asChild>
                                    <Button className="w-full mt-6 bg-green-600">
                                        <Bell className="mr-2 h-4 w-4" /> Set Price Alert
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Set Price Alert</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 pt-4">
                                        <div className="space-y-2">
                                            <label className="text-sm">Target Price</label>
                                            <Input
                                                type="number"
                                                value={targetPrice}
                                                onChange={(e) => setTargetPrice(e.target.value)}
                                                placeholder="Enter target price"
                                            />
                                        </div>
                                        <Button
                                            className="w-full bg-green-600"
                                            onClick={handlePriceAlert}
                                        >
                                            Create Alert
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        <Tabs defaultValue="retailers" className="space-y-6">
                            <TabsList className="bg-zinc-800/50">
                                <TabsTrigger value="retailers">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Retailers
                                </TabsTrigger>
                                <TabsTrigger value="price-history">
                                    <TrendingUp className="h-4 w-4 mr-2" />
                                    Price History
                                </TabsTrigger>
                                <TabsTrigger value="specs">
                                    <Info className="h-4 w-4 mr-2" />
                                    Specifications
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="retailers">
                                <div className="space-y-4">
                                    {product.stores.map((retailer) => (
                                        <div key={retailer.storeName}
                                            className="flex items-center justify-between p-6 rounded-lg bg-zinc-800/50">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-lg">{retailer.storeName}</p>
                                                    <span className="text-sm text-zinc-400">★ {retailer.rating}</span>
                                                </div>
                                                <p className="text-3xl font-bold">${retailer.price}</p>
                                                <p className="text-sm text-zinc-400">{retailer.shipping?.cost || 'Free Shipping'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={retailer.inStock ? "text-green-500 mb-2" : "text-red-500 mb-2"}>
                                                    {retailer.inStock ? "In Stock" : "Out of Stock"}
                                                </p>
                                                <Button className="bg-green-600" asChild>
                                                    <a href={retailer.url} target="_blank" rel="noopener noreferrer">
                                                        View Deal
                                                    </a>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="price-history">
                                <div className="bg-zinc-800/50 rounded-lg p-6">
                                    <div className="h-[400px]">
                                        <PriceChart data={product.priceHistory} />
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>

            {/* Image Zoom Modal */}
            <Dialog open={showZoom} onOpenChange={setShowZoom}>
                <DialogContent className="max-w-4xl">
                    <img
                        src={product.images[selectedImage]}
                        alt={product.name || 'Product Name Not Available'}
                        className="w-full h-auto"
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}

// Loading Skeleton
function ProductSkeleton() {
    return (
        <div className="min-h-screen bg-zinc-900 md:pt-20">
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Skeleton className="h-[400px] w-full" />
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                        <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-24" />
                            <Skeleton className="h-24" />
                            <Skeleton className="h-24" />
                            <Skeleton className="h-24" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}