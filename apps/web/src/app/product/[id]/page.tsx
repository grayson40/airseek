'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
    ShoppingCart,
    Award,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    Tag,
    Percent,
    DollarSign,
    Star,
    History,
    // BarChart3,
    Plus,
    Minus,
    Check,
    ArrowRight,
} from 'lucide-react'
import { PriceChart } from "@/components/price-chart"
import Link from 'next/link'
import { Product } from '@/types'
import Image from 'next/image'

// Define simple interface for price summary
interface PriceSummary {
    thirtyDayLow?: number;
    thirtyDayHigh?: number;
    trend?: 'up' | 'down' | 'stable';
}

// Define price history entry
interface PriceHistoryEntry {
    date: string;
    price: number;
}

// Extend Product type to include priceHistory
type ProductWithPriceHistory = Product & {
    priceHistory?: PriceHistoryEntry[] | PriceSummary;
    popularity?: number;
};

// Helper function to safely check if priceHistory is a PriceSummary
function isPriceSummary(obj: any): obj is PriceSummary {
    return obj && typeof obj === 'object' && !Array.isArray(obj) && 
        ('thirtyDayLow' in obj || 'thirtyDayHigh' in obj || 'trend' in obj);
}

// Define a type for similar products
type SimilarProduct = {
    id: string;
    name: string;
    image: string;
    price: number;
    category: string;
};

export default function ProductPage() {
    const params = useParams()
    const router = useRouter()
    const [product, setProduct] = useState<ProductWithPriceHistory | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [selectedImage, setSelectedImage] = useState(0)
    const [showZoom, setShowZoom] = useState(false)
    const [priceAlertOpen, setPriceAlertOpen] = useState(false)
    const [targetPrice, setTargetPrice] = useState('')
    const [sortOrder, setSortOrder] = useState<'price' | 'rating'>('price')
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [showAllRetailers, setShowAllRetailers] = useState(false)
    const [comparisonIds, setComparisonIds] = useState<string[]>([])
    const [similarProducts, setSimilarProducts] = useState<SimilarProduct[]>([])
    const [loadingSimilar, setLoadingSimilar] = useState(true)

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
                
                // After getting product, fetch similar products
                fetchSimilarProducts(data.category, data.brand, params.id as string);
            } catch (error) {
                console.error('Error fetching product:', error)
                toast.error('Product not found or an error occurred while fetching.')
            } finally {
                setIsLoading(false)
            }
        }

        // Check for existing comparison list in localStorage
        const savedComparison = localStorage.getItem('comparisonList')
        if (savedComparison) {
            setComparisonIds(JSON.parse(savedComparison))
        }

        if (params.id) {
            fetchProduct()
        }
    }, [params.id])
    
    // Fetch similar products by category and brand
    const fetchSimilarProducts = async (category: string, brand: string, currentId: string) => {
        setLoadingSimilar(true)
        try {
            // Get products in the same category
            const response = await fetch(`/api/products?category=${category}&limit=5`);
            if (!response.ok) {
                throw new Error('Failed to fetch similar products');
            }
            
            let similar = await response.json();
            
            // Filter out the current product
            similar = similar.filter((p: any) => p.id !== currentId);
            
            // If we have less than 3 products, try to fetch more with the same brand
            if (similar.length < 3) {
                const brandResponse = await fetch(`/api/products?brand=${brand}&limit=3`);
                if (brandResponse.ok) {
                    const brandSimilar = await brandResponse.json();
                    
                    // Combine results, removing duplicates and current product
                    const filtered = brandSimilar.filter((p: any) => 
                        p.id !== currentId && !similar.some((s: any) => s.id === p.id)
                    );
                    
                    similar = [...similar, ...filtered].slice(0, 4);
                }
            }
            
            // Map to our similar product type
            const mappedSimilar = similar.map((p: any) => ({
                id: p.id,
                name: p.name,
                image: p.images?.[0] || '',
                price: p.lowestPrice || 0,
                category: p.category
            }));
            
            setSimilarProducts(mappedSimilar);
        } catch (error) {
            console.error('Error fetching similar products:', error);
        } finally {
            setLoadingSimilar(false);
        }
    };
    
    // Navigate to a similar product
    const goToProduct = (id: string) => {
        router.push(`/product/${id}`);
    };

    if (isLoading) {
        return <ProductSkeleton />
    }

    if (!product) {
        return <div className="text-center">Product not found</div>
    }

    // Sort retailers based on selected order
    const sortedRetailers = [...product.stores].sort((a, b) => {
        if (sortOrder === 'price') {
            return a.price - b.price
        } else {
            return (b.rating || 0) - (a.rating || 0)
        }
    })

    // Get best deal (lowest price with in-stock)
    const bestDeal = sortedRetailers.find(retailer => retailer.inStock) || sortedRetailers[0]

    // Calculate price and savings info
    const averagePrice = Math.round((product.highestPrice + product.lowestPrice) / 2)
    const savings = bestDeal ? Math.round((averagePrice - bestDeal.price) / averagePrice * 100) : 0
    
    // Handle retailer sort
    const toggleSortOrder = () => {
        setSortOrder(sortOrder === 'price' ? 'rating' : 'price')
        setIsDropdownOpen(false)
    }

    // Price alert handler
    const handlePriceAlert = () => {
        if (!targetPrice) return

        // Set default value to 10% below current price if not specified
        const alertPrice = targetPrice || (bestDeal?.price * 0.9).toFixed(2)
        
        toast.success(`We'll notify you when the price drops below $${alertPrice}!`)
        setPriceAlertOpen(false)
        setTargetPrice('')
    }

    // Image zoom handler
    const handleImageZoom = (index: number) => {
        setSelectedImage(index)
        setShowZoom(true)
    }

    // Next/Previous image handlers
    const nextImage = () => {
        setSelectedImage(prev => (prev === product.images.length - 1 ? 0 : prev + 1))
    }

    const prevImage = () => {
        setSelectedImage(prev => (prev === 0 ? product.images.length - 1 : prev))
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

    // Handle compare toggle
    const toggleCompare = () => {
        const productId = params.id as string
        let newComparisonIds: string[]
        
        if (comparisonIds.includes(productId)) {
            // Remove from comparison
            newComparisonIds = comparisonIds.filter(id => id !== productId)
            toast.info('Removed from comparison')
        } else {
            // Add to comparison
            newComparisonIds = [...comparisonIds, productId]
            toast.success('Added to comparison')
        }
        
        setComparisonIds(newComparisonIds)
        localStorage.setItem('comparisonList', JSON.stringify(newComparisonIds))
    }

    // Start comparison
    const startComparison = () => {
        if (comparisonIds.length > 1) {
            router.push(`/compare?products=${comparisonIds.join(',')}`)
        } else {
            toast.info('Add at least one more product to compare')
        }
    }

    // Check if current product is in comparison list
    const isInComparison = comparisonIds.includes(params.id as string)

    return (
        <div className="min-h-screen bg-zinc-900 md:pt-20">
            {/* Back Navigation */}
            <div className="container mx-auto px-4 py-4">
                <div className="flex justify-between items-center">
                    <Link href={`/categories/${product.category}s`} className="text-zinc-400 hover:text-green-500 inline-flex items-center group transition-colors">
                        <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        <span>Back to {product.category}s</span>
                    </Link>
                    
                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className={isInComparison ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}
                            onClick={toggleCompare}
                            aria-label={isInComparison ? "Remove from comparison" : "Add to comparison"}
                        >
                            {isInComparison ? 
                                <><Check className="h-3.5 w-3.5 mr-1.5" /> In Comparison</> : 
                                <><Plus className="h-3.5 w-3.5 mr-1.5" /> Add to Compare</>
                            }
                        </Button>
                        
                        {comparisonIds.length > 1 && (
                            <Button
                                variant="default"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 transition-colors"
                                onClick={startComparison}
                                aria-label={`Compare ${comparisonIds.length} products`}
                            >
                                Compare ({comparisonIds.length})
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-4">
                {/* Product Header with Image Gallery */}
                <div className="mb-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
                        {/* Image Gallery */}
                        <div className="space-y-4">
                            <div className="relative bg-zinc-800/30 rounded-lg overflow-hidden">
                                <div
                                    className="bg-zinc-800/50 rounded-lg overflow-hidden cursor-zoom-in group"
                                    onClick={() => handleImageZoom(selectedImage)}
                                    role="button"
                                    aria-label="Click to zoom image"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            handleImageZoom(selectedImage);
                                        }
                                    }}
                                >
                                    <Image
                                        src={product.images[selectedImage]}
                                        alt={product.name || 'Product Image'}
                                        className="w-full h-[400px] object-contain p-4 transition-transform group-hover:scale-105"
                                        width={800}
                                        height={400}
                                        priority={true}
                                        loading="eager"
                                    />
                                    <div className="absolute bottom-2 right-2 bg-zinc-900/70 text-zinc-400 text-xs px-2 py-1 rounded-full">
                                        Click to zoom
                                    </div>
                                </div>
                                
                                {product.images.length > 1 && (
                                    <>
                                        <Button 
                                            variant="outline" 
                                            size="icon" 
                                            className="absolute left-2 top-1/2 transform -translate-y-1/2 rounded-full bg-zinc-900/70 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                prevImage();
                                            }}
                                            aria-label="Previous image"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="icon" 
                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full bg-zinc-900/70 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                nextImage();
                                            }}
                                            aria-label="Next image"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}
                            </div>
                            
                            {product.images.length > 1 && (
                                <div className="grid grid-cols-4 gap-2">
                                    {product.images.map((img, i) => (
                                        <div
                                            key={i}
                                            className={`bg-zinc-800/50 rounded-lg overflow-hidden cursor-pointer transition-all hover:opacity-90
                                                ${selectedImage === i ? 'ring-2 ring-green-500 scale-105' : 'opacity-70 hover:opacity-100'}`}
                                            onClick={() => setSelectedImage(i)}
                                            role="button"
                                            aria-label={`Select image ${i + 1}`}
                                            aria-pressed={selectedImage === i}
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    setSelectedImage(i);
                                                }
                                            }}
                                        >
                                            <Image
                                                src={img}
                                                alt={`${product.name || 'Product'} - Image ${i + 1}`}
                                                className="w-full h-24 object-contain p-2"
                                                width={100}
                                                height={100}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Product Info */}
                        <div>
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        <Badge variant="outline" className="bg-zinc-800/70 text-green-400 border-green-500/50 font-medium">
                                            {product.category}
                                        </Badge>
                                        <Badge variant="outline" className="bg-zinc-800/70 border-zinc-700">
                                            {product.type.toUpperCase()}
                                        </Badge>
                                        <Badge variant="outline" className="bg-zinc-800/70 border-zinc-700">
                                            {product.platform}
                                        </Badge>
                                    </div>
                                    <h1 className="text-2xl font-bold mb-3 text-white leading-tight">{product.name || 'Product Name Not Available'}</h1>
                                    <div className="flex flex-wrap gap-4 text-sm text-zinc-400 mb-4">
                                        <span className="flex items-center"><Info className="h-3.5 w-3.5 mr-1.5 text-zinc-500" /> Brand: <span className="text-white ml-1 font-medium">{product.brand}</span></span>
                                        {/* <span className="flex items-center"><BarChart3 className="h-3.5 w-3.5 mr-1.5 text-zinc-500" /> FPS: <span className="text-white ml-1 font-medium">{product.fps.min}-{product.fps.max}</span></span> */}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleShare}
                                        className="hover:bg-zinc-800 hover:text-green-400 hover:border-green-500/30 transition-colors"
                                        aria-label="Share product"
                                        title="Share product"
                                    >
                                        <Share className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleAddToFavorites}
                                        className="hover:bg-zinc-800 hover:text-green-400 hover:border-green-500/30 transition-colors"
                                        aria-label="Add to favorites"
                                        title="Add to favorites"
                                    >
                                        <Heart className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Best Deal */}
                            {bestDeal && (
                                <div className="bg-gradient-to-br from-green-900/40 to-green-900/20 rounded-lg p-6 my-6 border border-green-500/20 shadow-lg hover:shadow-green-900/5 transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center mb-1">
                                                <Award className="h-4 w-4 mr-2 text-green-400" />
                                                <span className="text-sm font-medium text-green-400 uppercase tracking-wide">BEST DEAL</span>
                                            </div>
                                            <h2 className="text-xl font-bold mb-1">{bestDeal.storeName}</h2>
                                            <div className="flex items-center text-sm text-zinc-400">
                                                <Star className="h-3 w-3 mr-1 text-yellow-400" />
                                                <span>{bestDeal.rating || 'No rating'}</span>
                                                {bestDeal.reviews && <span className="ml-1">({bestDeal.reviews} reviews)</span>}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold">${bestDeal.price}</div>
                                            {savings > 0 && (
                                                <span className="text-sm text-green-400 flex items-center justify-end">
                                                    <Percent className="h-3 w-3 mr-1" /> Save {savings}%
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className={bestDeal.inStock 
                                            ? "text-green-400 text-sm flex items-center bg-green-900/30 px-2 py-1 rounded-full"
                                            : "text-amber-500 text-sm flex items-center bg-amber-900/30 px-2 py-1 rounded-full"}>
                                            {bestDeal.inStock 
                                                ? <Check className="h-3.5 w-3.5 mr-1.5" /> 
                                                : <Minus className="h-3.5 w-3.5 mr-1.5" />}
                                            {bestDeal.inStock ? "In Stock" : "Out of Stock"}
                                        </span>
                                        <Button 
                                            className="bg-green-600 hover:bg-green-700 transition-colors relative overflow-hidden group"
                                            disabled={!bestDeal.inStock}
                                            aria-label={bestDeal.inStock ? "View deal at " + bestDeal.storeName : "Out of stock at " + bestDeal.storeName}
                                            asChild
                                        >
                                            <a href={bestDeal.url} target="_blank" rel="noopener noreferrer">
                                                <ShoppingCart className="mr-2 h-4 w-4" /> 
                                                <span>View Deal</span>
                                                <span className="absolute inset-0 w-full h-full bg-white/10 transform -translate-x-full group-hover:translate-x-0 transition-transform"></span>
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Price Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-zinc-800/50 rounded-lg p-4 hover:bg-zinc-800/70 transition-colors border border-zinc-700/50 hover:border-zinc-700">
                                    <div className="flex items-center mb-1">
                                        <div className="w-6 h-6 rounded-full bg-green-900/50 flex items-center justify-center mr-2">
                                            <DollarSign className="h-3.5 w-3.5 text-green-400" />
                                        </div>
                                        <p className="text-sm font-medium text-zinc-300">Lowest Price</p>
                                    </div>
                                    <p className="text-xl font-bold mt-1">${
                                        product.priceHistory && isPriceSummary(product.priceHistory) && 
                                        typeof product.priceHistory.thirtyDayLow === 'number'
                                            ? product.priceHistory.thirtyDayLow 
                                            : product.lowestPrice
                                    }</p>
                                </div>
                                <div className="bg-zinc-800/50 rounded-lg p-4 hover:bg-zinc-800/70 transition-colors border border-zinc-700/50 hover:border-zinc-700">
                                    <div className="flex items-center mb-1">
                                        <div className="w-6 h-6 rounded-full bg-yellow-900/50 flex items-center justify-center mr-2">
                                            <DollarSign className="h-3.5 w-3.5 text-yellow-400" />
                                        </div>
                                        <p className="text-sm font-medium text-zinc-300">Highest Price</p>
                                    </div>
                                    <p className="text-xl font-bold mt-1">${
                                        product.priceHistory && isPriceSummary(product.priceHistory) && 
                                        typeof product.priceHistory.thirtyDayHigh === 'number'
                                            ? product.priceHistory.thirtyDayHigh
                                            : product.highestPrice
                                    }</p>
                                </div>
                                <div className="bg-zinc-800/50 rounded-lg p-4 hover:bg-zinc-800/70 transition-colors border border-zinc-700/50 hover:border-zinc-700">
                                    <div className="flex items-center mb-1">
                                        <div className="w-6 h-6 rounded-full bg-blue-900/50 flex items-center justify-center mr-2">
                                            <Tag className="h-3.5 w-3.5 text-blue-400" />
                                        </div>
                                        <p className="text-sm font-medium text-zinc-300">Retailers</p>
                                    </div>
                                    <p className="text-xl font-bold mt-1">{product.stores.length}</p>
                                </div>
                            </div>

                            {/* Price Alert Button */}
                            <Dialog open={priceAlertOpen} onOpenChange={setPriceAlertOpen}>
                                <DialogTrigger asChild>
                                    <Button 
                                        className="w-full bg-green-600 hover:bg-green-700 transition-colors relative overflow-hidden group" 
                                        aria-label="Set up price alert notification"
                                    >
                                        <Bell className="mr-2 h-4 w-4" /> 
                                        <span>Set Price Alert</span>
                                        <span className="absolute inset-0 w-full h-full bg-white/10 transform -translate-x-full group-hover:translate-x-0 transition-transform"></span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent title="Set Price Alert" className="bg-zinc-900 border border-zinc-700">
                                    <DialogHeader>
                                        <DialogTitle className="text-xl font-bold text-white">Set Price Alert</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 pt-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-300">Target Price</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                                <Input
                                                    type="number"
                                                    value={targetPrice}
                                                    onChange={(e) => setTargetPrice(e.target.value)}
                                                    placeholder={`${(bestDeal?.price * 0.9).toFixed(2)}`}
                                                    className="pl-9 bg-zinc-800 border-zinc-700 focus:border-green-500/50 focus:ring-green-500/20"
                                                    aria-label="Target price for alert"
                                                />
                                            </div>
                                            <p className="text-xs text-zinc-400 flex items-center">
                                                <Info className="h-3 w-3 mr-1 text-zinc-500" />
                                                We&apos;ll notify you when the price drops below this amount
                                            </p>
                                        </div>
                                        <Button
                                            className="w-full bg-green-600 hover:bg-green-700 transition-colors"
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
                                    Specs
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="retailers">
                                <div className="mb-6 flex flex-wrap justify-between items-center">
                                    <h3 className="text-xl font-bold flex items-center">
                                        <ExternalLink className="h-4 w-4 mr-2 text-green-400" /> 
                                        All Retailers ({sortedRetailers.length})
                                    </h3>
                                    <div className="flex gap-2 items-center">
                                        <div className="relative">
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                className="text-sm bg-zinc-800/70 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 transition-colors"
                                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                aria-haspopup="listbox"
                                                aria-expanded={isDropdownOpen}
                                                aria-label="Sort retailers"
                                            >
                                                <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-green-400" />
                                                Sort by: {sortOrder === 'price' ? 'Price' : 'Rating'}
                                            </Button>
                                            
                                            {isDropdownOpen && (
                                                <div className="absolute right-0 top-10 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg z-10">
                                                    <div className="py-1" role="listbox">
                                                        <button
                                                            role="option"
                                                            aria-selected={sortOrder === 'price'}
                                                            className={`block px-4 py-2 text-sm w-full text-left hover:bg-zinc-700 ${sortOrder === 'price' ? 'bg-zinc-700/50 text-green-400' : ''}`}
                                                            onClick={toggleSortOrder}
                                                        >
                                                            Price (Low to High)
                                                        </button>
                                                        <button
                                                            role="option"
                                                            aria-selected={sortOrder === 'rating'}
                                                            className={`block px-4 py-2 text-sm w-full text-left hover:bg-zinc-700 ${sortOrder === 'rating' ? 'bg-zinc-700/50 text-green-400' : ''}`}
                                                            onClick={toggleSortOrder}
                                                        >
                                                            Rating (High to Low)
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    {(showAllRetailers ? sortedRetailers : sortedRetailers.slice(0, 3)).map((retailer, index) => (
                                        <div 
                                            key={retailer.storeName || index}
                                            className={`group flex flex-col md:flex-row md:items-center justify-between p-6 rounded-lg border transition-all ${
                                                index === 0 && sortOrder === 'price' && retailer.inStock 
                                                    ? 'bg-gradient-to-br from-green-900/30 to-green-900/10 border-green-500/30 shadow-md' 
                                                    : 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600'
                                            }`}
                                        >
                                            <div className="mb-4 md:mb-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-medium text-lg">{retailer.storeName}</p>
                                                    {retailer.rating ? (
                                                        <div className="text-sm text-zinc-300 flex items-center bg-zinc-800/80 px-2 py-0.5 rounded-full">
                                                            <Star className="h-3 w-3 mr-1 text-yellow-400 fill-yellow-400" />
                                                            {retailer.rating}
                                                            {retailer.reviews && <span className="ml-1 text-zinc-400">({retailer.reviews})</span>}
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-zinc-500 px-2 py-0.5 rounded-full bg-zinc-800/80">
                                                            No ratings
                                                        </div>
                                                    )}
                                                    {index === 0 && sortOrder === 'price' && retailer.inStock && (
                                                        <Badge variant="outline" className="bg-green-900/30 text-green-400 border-green-500/50 ml-auto md:ml-0">
                                                            <Award className="h-3 w-3 mr-1" /> Best Price
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-end gap-2">
                                                    <p className="text-2xl font-bold">${retailer.price}</p>
                                                    {index === 0 && sortOrder === 'price' && bestDeal && savings > 0 && (
                                                        <span className="text-sm text-green-400 flex items-center mb-1">
                                                            <Percent className="h-3 w-3 mr-1" /> {savings}% below avg.
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-zinc-400 flex items-center mt-1">
                                                    <History className="h-3 w-3 mr-1 text-zinc-500" />
                                                    Updated: {new Date(retailer.lastUpdated).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="flex flex-col md:text-right gap-3">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`text-sm flex items-center md:justify-end px-2 py-1 rounded-full w-fit md:ml-auto ${
                                                        retailer.inStock 
                                                            ? "text-green-400 bg-green-900/30" 
                                                            : "text-amber-500 bg-amber-900/20"
                                                    }`}>
                                                        {retailer.inStock 
                                                            ? <Check className="h-3.5 w-3.5 mr-1.5" /> 
                                                            : <Minus className="h-3.5 w-3.5 mr-1.5" />}
                                                        {retailer.inStock ? "In Stock" : "Out of Stock"}
                                                    </span>
                                                    <span className="text-sm text-zinc-400 flex items-center md:justify-end">
                                                        {retailer.shipping?.cost === 0 
                                                            ? <span className="text-green-400 flex items-center"><Tag className="h-3 w-3 mr-1" /> Free Shipping</span> 
                                                            : <span className="flex items-center"><Tag className="h-3 w-3 mr-1 text-zinc-500" /> Shipping: ${retailer.shipping?.cost || 'N/A'}</span>}
                                                    </span>
                                                </div>
                                                <Button 
                                                    className="bg-green-600 hover:bg-green-700 transition-colors relative overflow-hidden group mt-1" 
                                                    asChild
                                                    disabled={!retailer.inStock}
                                                >
                                                    <a href={retailer.url} target="_blank" rel="noopener noreferrer">
                                                        <ShoppingCart className="mr-2 h-4 w-4" /> 
                                                        View Deal
                                                        <span className="absolute inset-0 w-full h-full bg-white/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></span>
                                                    </a>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {sortedRetailers.length > 3 && !showAllRetailers && (
                                        <Button 
                                            variant="outline" 
                                            className="w-full border-dashed border-zinc-700 hover:border-green-500/30 hover:bg-zinc-800/50 transition-all flex items-center justify-center gap-2 py-6" 
                                            onClick={() => setShowAllRetailers(true)}
                                        >
                                            <Plus className="h-4 w-4" />
                                            Show {sortedRetailers.length - 3} more retailers
                                        </Button>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="price-history">
                                <div className="bg-zinc-800/50 rounded-lg p-6">
                                    <h3 className="text-xl font-medium mb-4">Price History</h3>
                                    <div className="h-[400px]">
                                        <PriceChart data={product.priceHistory || []} />
                                    </div>
                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-zinc-800/30 p-4 rounded-lg">
                                            <p className="text-sm text-zinc-400 mb-1">30-Day Low</p>
                                            <p className="text-xl font-bold">${
                                                product.priceHistory && isPriceSummary(product.priceHistory) && 
                                                typeof product.priceHistory.thirtyDayLow === 'number'
                                                    ? product.priceHistory.thirtyDayLow 
                                                    : product.lowestPrice
                                            }</p>
                                        </div>
                                        <div className="bg-zinc-800/30 p-4 rounded-lg">
                                            <p className="text-sm text-zinc-400 mb-1">30-Day High</p>
                                            <p className="text-xl font-bold">${
                                                product.priceHistory && isPriceSummary(product.priceHistory) && 
                                                typeof product.priceHistory.thirtyDayHigh === 'number'
                                                    ? product.priceHistory.thirtyDayHigh
                                                    : product.highestPrice
                                            }</p>
                                        </div>
                                        <div className="bg-zinc-800/30 p-4 rounded-lg">
                                            <p className="text-sm text-zinc-400 mb-1">Price Trend</p>
                                            <p className="text-xl font-bold flex items-center">
                                                {product.priceHistory && isPriceSummary(product.priceHistory) && 
                                                 product.priceHistory.trend === 'down' ? (
                                                    <><Percent className="h-4 w-4 mr-2 text-green-400" /> Decreasing</>
                                                ) : product.priceHistory && isPriceSummary(product.priceHistory) && 
                                                   product.priceHistory.trend === 'up' ? (
                                                    <><Percent className="h-4 w-4 mr-2 text-red-400" /> Increasing</>
                                                ) : (
                                                    <><Minus className="h-4 w-4 mr-2 text-yellow-400" /> Stable</>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="specs">
                                <div className="bg-zinc-800/50 rounded-lg p-6">
                                    <h3 className="text-xl font-medium mb-4">Technical Specifications</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-4">
                                            <div className="bg-zinc-800/30 p-4 rounded-lg">
                                                <p className="text-sm text-zinc-400 mb-1">Brand</p>
                                                <p className="font-medium">{product.brand}</p>
                                            </div>
                                            <div className="bg-zinc-800/30 p-4 rounded-lg">
                                                <p className="text-sm text-zinc-400 mb-1">Type</p>
                                                <p className="font-medium">{product.type}</p>
                                            </div>
                                            <div className="bg-zinc-800/30 p-4 rounded-lg">
                                                <p className="text-sm text-zinc-400 mb-1">Category</p>
                                                <p className="font-medium">{product.category}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="bg-zinc-800/30 p-4 rounded-lg">
                                                <p className="text-sm text-zinc-400 mb-1">Platform</p>
                                                <p className="font-medium">{product.platform}</p>
                                            </div>
                                            <div className="bg-zinc-800/30 p-4 rounded-lg">
                                                <p className="text-sm text-zinc-400 mb-1">FPS Range</p>
                                                <p className="font-medium">{product.fps.min} - {product.fps.max} FPS</p>
                                            </div>
                                            <div className="bg-zinc-800/30 p-4 rounded-lg">
                                                <p className="text-sm text-zinc-400 mb-1">Created</p>
                                                <p className="font-medium">{new Date(product.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        {/* Similar Products */}
                        <div className="bg-zinc-800/50 rounded-lg p-6 mb-6 border border-zinc-700/50">
                            <h3 className="text-xl font-bold mb-4 flex items-center">
                                <Tag className="h-4 w-4 mr-2 text-green-400" />
                                Similar Products
                            </h3>
                            <div className="space-y-3">
                                {loadingSimilar ? (
                                    <div className="space-y-3">
                                        <Skeleton className="h-16 w-full bg-zinc-800/70" />
                                        <Skeleton className="h-16 w-full bg-zinc-800/70" />
                                        <Skeleton className="h-16 w-full bg-zinc-800/70" />
                                    </div>
                                ) : similarProducts.length > 0 ? (
                                    similarProducts.map((prod) => (
                                        <div 
                                            key={prod.id} 
                                            className="flex gap-3 items-center bg-zinc-800/30 p-3 rounded-lg cursor-pointer hover:bg-zinc-700/40 transition-all hover:translate-x-1 border border-zinc-700/30 hover:border-green-500/20"
                                            onClick={() => goToProduct(prod.id)}
                                            role="button"
                                            tabIndex={0}
                                            aria-label={`View similar product: ${prod.name}`}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    goToProduct(prod.id);
                                                }
                                            }}
                                        >
                                            <div className="w-16 h-16 bg-zinc-900/50 rounded flex-shrink-0 overflow-hidden">
                                                {prod.image ? (
                                                    <Image 
                                                        src={prod.image} 
                                                        alt={prod.name}
                                                        width={64}
                                                        height={64}
                                                        className="w-full h-full object-contain hover:scale-110 transition-transform"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-zinc-500">
                                                        <ShoppingCart className="h-4 w-4" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate text-white">{prod.name}</p>
                                                <div className="flex items-center justify-between mt-1">
                                                    <p className="text-green-400 font-bold">${prod.price}</p>
                                                    <Badge variant="outline" className="text-xs bg-zinc-800/70 border-zinc-700 px-2">
                                                        {prod.category}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 bg-zinc-800/30 rounded-lg border border-dashed border-zinc-700">
                                        <p className="text-sm text-zinc-400 mb-2">
                                            No similar products found
                                        </p>
                                        <Link href={`/categories/${product.category}s`} 
                                            className="text-xs text-green-400 hover:underline inline-flex items-center">
                                            <ArrowRight className="h-3 w-3 mr-1" />
                                            Browse all {product.category}s
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Zoom Modal */}
            <Dialog open={showZoom} onOpenChange={setShowZoom}>
                <DialogContent title="Product Image" className="max-w-4xl bg-zinc-900/95 border-zinc-700 backdrop-blur">
                    <DialogHeader>
                        <DialogTitle className="sr-only">Product Image</DialogTitle>
                    </DialogHeader>
                    <div className="relative">
                        <Image
                            src={product.images[selectedImage]}
                            alt={product.name || 'Product Image'}
                            className="w-full h-auto object-contain"
                            width={1200}
                            height={800}
                            priority={true}
                        />
                        {product.images.length > 1 && (
                            <>
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="absolute left-2 top-1/2 transform -translate-y-1/2 rounded-full bg-zinc-900/80 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 transition-colors"
                                    onClick={prevImage}
                                    aria-label="Previous image"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full bg-zinc-900/80 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 transition-colors"
                                    onClick={nextImage}
                                    aria-label="Next image"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                            {product.images.length > 1 && product.images.map((_, i) => (
                                <button
                                    key={i}
                                    className={`w-2 h-2 rounded-full ${selectedImage === i ? 'bg-green-500' : 'bg-zinc-600'} 
                                        hover:bg-green-400 transition-colors`}
                                    onClick={() => setSelectedImage(i)}
                                    aria-label={`View image ${i + 1}`}
                                    aria-current={selectedImage === i ? "true" : "false"}
                                />
                            ))}
                        </div>
                    </div>
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