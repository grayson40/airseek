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
    BarChart3,
    Plus,
    Minus,
    Check,
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                    <Link href={`/categories/${product.category}s`} className="text-zinc-400 hover:text-green-500 inline-flex items-center">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to {product.category}s
                    </Link>
                    
                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className={isInComparison ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}
                            onClick={toggleCompare}
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
                                className="bg-green-600"
                                onClick={startComparison}
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
                            <div className="relative">
                                <div
                                    className="bg-zinc-800/50 rounded-lg overflow-hidden cursor-zoom-in"
                                    onClick={() => handleImageZoom(selectedImage)}
                                >
                                    <Image
                                        src={product.images[selectedImage]}
                                        alt={product.name || 'Product Name Not Available'}
                                        className="w-full h-[400px] object-contain p-4"
                                        width={800}
                                        height={400}
                                    />
                                </div>
                                
                                {product.images.length > 1 && (
                                    <>
                                        <Button 
                                            variant="outline" 
                                            size="icon" 
                                            className="absolute left-2 top-1/2 transform -translate-y-1/2 rounded-full bg-zinc-900/70 border-zinc-700"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                prevImage();
                                            }}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="icon" 
                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full bg-zinc-900/70 border-zinc-700"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                nextImage();
                                            }}
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
                                            className={`bg-zinc-800/50 rounded-lg overflow-hidden cursor-pointer 
                                                ${selectedImage === i ? 'ring-2 ring-green-500' : ''}`}
                                            onClick={() => setSelectedImage(i)}
                                        >
                                            <Image
                                                src={img}
                                                alt={`${product.name || 'Product Name Not Available'} ${i + 1}`}
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
                                        <Badge variant="outline" className="bg-zinc-800/70 text-green-400 border-green-500/50">
                                            {product.category}
                                        </Badge>
                                        <Badge variant="outline" className="bg-zinc-800/70 border-zinc-700">
                                            {product.type.toUpperCase()}
                                        </Badge>
                                        <Badge variant="outline" className="bg-zinc-800/70 border-zinc-700">
                                            {product.platform}
                                        </Badge>
                                    </div>
                                    <h1 className="text-2xl font-bold mb-3">{product.name || 'Product Name Not Available'}</h1>
                                    <div className="flex items-center gap-4 text-sm text-zinc-400 mb-4">
                                        <span className="flex items-center"><Info className="h-3.5 w-3.5 mr-1.5" /> Brand: <span className="text-white ml-1">{product.brand}</span></span>
                                        <span className="flex items-center"><BarChart3 className="h-3.5 w-3.5 mr-1.5" /> FPS: <span className="text-white ml-1">{product.fps.min}-{product.fps.max}</span></span>
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

                            {/* Best Deal */}
                            {bestDeal && (
                                <div className="bg-green-900/30 rounded-lg p-6 my-6 border border-green-500/20">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center mb-1">
                                                <Award className="h-4 w-4 mr-2 text-green-400" />
                                                <span className="text-sm font-medium text-green-400">BEST DEAL</span>
                                            </div>
                                            <h3 className="text-xl font-bold mb-1">{bestDeal.storeName}</h3>
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
                                        <span className={bestDeal.inStock ? "text-green-400 text-sm flex items-center" : "text-red-400 text-sm flex items-center"}>
                                            {bestDeal.inStock ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Minus className="h-3.5 w-3.5 mr-1.5" />}
                                                    {bestDeal.inStock ? "In Stock" : "Out of Stock"}
                                        </span>
                                        <Button className="bg-green-600" asChild>
                                            <a href={bestDeal.url} target="_blank" rel="noopener noreferrer">
                                                <ShoppingCart className="mr-2 h-4 w-4" /> View Deal
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Price Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-zinc-800/50 rounded-lg p-4">
                                    <div className="flex items-center mb-1">
                                        <DollarSign className="h-3.5 w-3.5 mr-1.5 text-green-400" />
                                        <p className="text-sm text-zinc-400">Lowest Price</p>
                                    </div>
                                    <p className="text-xl font-bold">${
                                        product.priceHistory && isPriceSummary(product.priceHistory) && 
                                        typeof product.priceHistory.thirtyDayLow === 'number'
                                            ? product.priceHistory.thirtyDayLow 
                                            : product.lowestPrice
                                    }</p>
                                </div>
                                <div className="bg-zinc-800/50 rounded-lg p-4">
                                    <div className="flex items-center mb-1">
                                        <DollarSign className="h-3.5 w-3.5 mr-1.5 text-yellow-400" />
                                        <p className="text-sm text-zinc-400">Highest Price</p>
                                    </div>
                                    <p className="text-xl font-bold">${
                                        product.priceHistory && isPriceSummary(product.priceHistory) && 
                                        typeof product.priceHistory.thirtyDayHigh === 'number'
                                            ? product.priceHistory.thirtyDayHigh
                                            : product.highestPrice
                                    }</p>
                                </div>
                                <div className="bg-zinc-800/50 rounded-lg p-4">
                                    <div className="flex items-center mb-1">
                                        <Tag className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
                                        <p className="text-sm text-zinc-400">Retailers</p>
                                    </div>
                                    <p className="text-xl font-bold">{product.stores.length}</p>
                                </div>
                            </div>

                            {/* Price Alert Button */}
                            <Dialog open={priceAlertOpen} onOpenChange={setPriceAlertOpen}>
                                <DialogTrigger asChild>
                                    <Button className="w-full bg-green-600">
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
                                                placeholder={`Suggested: $${(bestDeal?.price * 0.9).toFixed(2)}`}
                                            />
                                            <p className="text-xs text-zinc-400">We&apos;ll notify you when the price drops below this amount</p>
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
                                    Specs
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="retailers">
                                <div className="mb-4 flex flex-wrap justify-between items-center">
                                    <h3 className="text-xl font-medium">All Retailers</h3>
                                    <div className="flex gap-2 items-center">
                                        <div className="relative">
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                className="text-sm"
                                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                            >
                                                <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
                                                Sort by: {sortOrder === 'price' ? 'Price' : 'Rating'}
                                            </Button>
                                            
                                            {isDropdownOpen && (
                                                <div className="absolute right-0 top-10 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg z-10">
                                                    <div className="py-1">
                                                        <button
                                                            className={`block px-4 py-2 text-sm w-full text-left hover:bg-zinc-700 ${sortOrder === 'price' ? 'bg-zinc-700/50' : ''}`}
                                                            onClick={toggleSortOrder}
                                                        >
                                                            Price (Low to High)
                                                        </button>
                                                        <button
                                                            className={`block px-4 py-2 text-sm w-full text-left hover:bg-zinc-700 ${sortOrder === 'rating' ? 'bg-zinc-700/50' : ''}`}
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
                                        <div key={retailer.storeName || index}
                                            className={`flex flex-col md:flex-row md:items-center justify-between p-6 rounded-lg ${
                                                index === 0 && sortOrder === 'price' && retailer.inStock 
                                                    ? 'bg-green-900/20 border border-green-500/20' 
                                                    : 'bg-zinc-800/50'
                                            }`}>
                                            <div className="mb-4 md:mb-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-medium text-lg">{retailer.storeName}</p>
                                                    {retailer.rating && (
                                                        <span className="text-sm text-zinc-400 flex items-center">
                                                            <Star className="h-3 w-3 mr-1 text-yellow-400" />
                                                            {retailer.rating}
                                                        </span>
                                                    )}
                                                    {index === 0 && sortOrder === 'price' && retailer.inStock && (
                                                        <Badge variant="outline" className="bg-green-900/30 text-green-400 border-green-500/50">
                                                            Best Price
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-2xl font-bold mb-1">${retailer.price}</p>
                                                <div className="text-sm text-zinc-400 flex items-center">
                                                    <History className="h-3 w-3 mr-1" />
                                                    Last updated: {new Date(retailer.lastUpdated).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="flex flex-col md:text-right gap-2">
                                                <p className={retailer.inStock ? "text-green-500 mb-2 flex items-center md:justify-end" : "text-red-500 mb-2 flex items-center md:justify-end"}>
                                                    {retailer.inStock ? <Check className="h-4 w-4 mr-1" /> : <Minus className="h-4 w-4 mr-1" />}
                                                    {retailer.inStock ? "In Stock" : "Out of Stock"}
                                                </p>
                                                <p className="text-sm text-zinc-400 mb-2">
                                                    {retailer.shipping?.cost === 0 
                                                        ? 'Free Shipping' 
                                                        : `Shipping: $${retailer.shipping?.cost}`}
                                                </p>
                                                <Button className="bg-green-600" asChild>
                                                    <a href={retailer.url} target="_blank" rel="noopener noreferrer">
                                                        View Deal
                                                    </a>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {sortedRetailers.length > 3 && !showAllRetailers && (
                                        <Button 
                                            variant="outline" 
                                            className="w-full border-dashed" 
                                            onClick={() => setShowAllRetailers(true)}
                                        >
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
                        <div className="bg-zinc-800/50 rounded-lg p-6 mb-6">
                            <h3 className="text-xl font-medium mb-4">Similar Products</h3>
                            <div className="space-y-4">
                                {loadingSimilar ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-20 w-full" />
                                        <Skeleton className="h-20 w-full" />
                                        <Skeleton className="h-20 w-full" />
                                    </div>
                                ) : similarProducts.length > 0 ? (
                                    similarProducts.map((prod) => (
                                        <div 
                                            key={prod.id} 
                                            className="flex gap-3 items-center bg-zinc-800/30 p-3 rounded-lg cursor-pointer hover:bg-zinc-700/50 transition-colors"
                                            onClick={() => goToProduct(prod.id)}
                                        >
                                            <div className="w-16 h-16 bg-zinc-900/50 rounded flex-shrink-0 overflow-hidden">
                                                {prod.image ? (
                                                    <Image 
                                                        src={prod.image} 
                                                        alt={prod.name}
                                                        width={64}
                                                        height={64}
                                                        className="w-full h-full object-contain"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-zinc-500">
                                                        <ShoppingCart className="h-4 w-4" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{prod.name}</p>
                                                <p className="text-green-400 font-bold">${prod.price}</p>
                                                <Badge variant="outline" className="mt-1 text-xs bg-zinc-800/70 border-zinc-700">
                                                    {prod.category}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-zinc-400">
                                        No similar products found.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Zoom Modal */}
            <Dialog open={showZoom} onOpenChange={setShowZoom}>
                <DialogContent className="max-w-4xl">
                    <div className="relative">
                        <Image
                            src={product.images[selectedImage]}
                            alt={product.name || 'Product Name Not Available'}
                            className="w-full h-auto"
                            width={1200}
                            height={800}
                        />
                        {product.images.length > 1 && (
                            <>
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="absolute left-2 top-1/2 transform -translate-y-1/2 rounded-full bg-zinc-900/70 border-zinc-700"
                                    onClick={prevImage}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full bg-zinc-900/70 border-zinc-700"
                                    onClick={nextImage}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </>
                        )}
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