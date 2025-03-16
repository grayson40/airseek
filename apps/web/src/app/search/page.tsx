'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    Search,
    Filter,
    Bookmark,
    BookmarkPlus,
    Loader2,
    History,
    X,
    BarChart2,
    Bell,
    ArrowRight
} from 'lucide-react'
import { ProductCard } from '@/components/ui/product-card'
import type { Product } from '@/types'

// Mock saved searches
const savedSearches = [
    { id: 1, query: "tokyo marui pistol", filters: { maxPrice: 300, brands: ["Tokyo Marui"] } },
    { id: 2, query: "m4 aeg", filters: { type: "AEG", minFps: 350 } },
]

// Mock recent searches
const recentSearches = [
    "krytac",
    "glock",
    "battery charger",
    "bbs 0.20g",
]

// Mock data
const brands = ['Tokyo Marui', 'KWA', 'VFC', 'G&G', 'Krytac', 'Classic Army', 'Umarex', 'ASG']

// power types
const powerTypes = [
    'aeg', 'gbbr', 'gbb_pistol', 'spring', 'hpa', 'co2', 'aep'
];



function SearchContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const query = searchParams.get('q') || ''

    // States
    const [searchInput, setSearchInput] = useState(query)
    const [isLoading, setIsLoading] = useState(true)
    const [products, setProducts] = useState<Product[]>([])
    const [priceRange, setPriceRange] = useState([0, 1000])
    const [fpsRange, setFpsRange] = useState([200, 400])
    const [selectedBrands, setSelectedBrands] = useState<string[]>([])
    const [selectedTypes, setSelectedTypes] = useState<string[]>([])
    const [sortBy, setSortBy] = useState("relevance")
    const [view, setView] = useState("grid") // grid or list
    const [currentPage, setCurrentPage] = useState(1)
    const productsPerPage = 24

    // Save search functionality
    const saveSearch = () => {
        console.log('Saving search:', { query, filters: { maxPrice: priceRange[1], minFps: fpsRange[0], brands: selectedBrands, type: selectedTypes[0] } })
    }

    // Handle search
    const handleSearch = useCallback(async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!searchInput.trim()) return

        setIsLoading(true)
        const params = new URLSearchParams(searchParams)
        params.set('q', searchInput)
        router.push(`/search?${params.toString()}`)

        // Fetch search results from the API
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(searchInput)}`)
            if (!response.ok) {
                throw new Error('Failed to fetch search results')
            }
            const data = await response.json()
            setProducts(data)
        } catch (error) {
            console.error('Error fetching search results:', error)
            setProducts([])
        } finally {
            setIsLoading(false)
        }
    }, [searchInput, searchParams, router])

    useEffect(() => {
        if (query) {
            handleSearch()
        }
    }, [query, handleSearch])

    // Process products to include price range and stock status
    const productsWithPriceRange = products.map(product => {
        const prices = product.stores.map(store => store.price)
        const lowestPrice = Math.min(...prices)
        const highestPrice = Math.max(...prices)
        const inStock = product.stores.some(store => store.inStock)
        const rating = Math.max(...product.stores.map(store => store.rating)) || 0
        const reviews = Math.max(...product.stores.map(store => store.reviews)) || 0

        return {
            ...product,
            lowestPrice,
            highestPrice,
            inStock,
            rating,
            reviews
        }
    })

    // Sort products
    const sortedProducts = [...productsWithPriceRange].sort((a, b) => {
        switch (sortBy) {
            case "price_asc": return a.lowestPrice - b.lowestPrice
            case "price_desc": return b.lowestPrice - a.lowestPrice
            case "rating": return b.rating - a.rating
            default: return 0 // relevance - as returned by the API
        }
    })

    // Calculate pagination
    const totalPages = Math.ceil(sortedProducts.length / productsPerPage)
    const currentProducts = sortedProducts.slice(
        (currentPage - 1) * productsPerPage, 
        currentPage * productsPerPage
    )

    // Product action handlers
    const handleCompare = (productId: string | number, e: React.MouseEvent) => {
        e.preventDefault();
        // Compare logic
        console.log(`Compare product: ${productId}`);
    };

    const handleTrackPrice = (productId: string | number, e: React.MouseEvent) => {
        e.preventDefault();
        // Track price logic
        console.log(`Track price for product: ${productId}`);
    };

    const handleSave = (productId: string | number, e: React.MouseEvent) => {
        e.preventDefault();
        // Save product logic
        console.log(`Save product: ${productId}`);
    };

    const handleViewDetails = (productId: string | number, e: React.MouseEvent) => {
        e.preventDefault();
        // Instead of preventing navigation, we could add additional logic here
        // before allowing the default navigation to occur
        console.log(`View details for product: ${productId}`);
    };

    // Filter panel component - shared between desktop and mobile
    const FilterContent = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Filters</h2>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        setPriceRange([0, 1000]);
                        setFpsRange([200, 400]);
                        setSelectedBrands([]);
                        setSelectedTypes([]);
                    }}
                    className="text-zinc-400 hover:text-white"
                >
                    Clear All
                </Button>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
                {/* Price Range */}
                <AccordionItem value="price" className="border-zinc-700">
                    <AccordionTrigger className="hover:no-underline">
                        <span className="flex items-center gap-2">
                            Price Range
                            {(priceRange[0] > 0 || priceRange[1] < 1000) && (
                                <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full">
                                    Active
                                </span>
                            )}
                        </span>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-4 pt-4">
                            <Input
                                type="number"
                                value={priceRange[0]}
                                onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                                placeholder="Min Price"
                                className="w-24 bg-zinc-800"
                            />
                            <Input
                                type="number"
                                value={priceRange[1]}
                                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                                placeholder="Max Price"
                                className="w-24 bg-zinc-800"
                            />
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* FPS Range */}
                <AccordionItem value="fps" className="border-zinc-700">
                    <AccordionTrigger className="hover:no-underline">
                        <span className="flex items-center gap-2">
                            FPS Range
                            {(fpsRange[0] > 200 || fpsRange[1] < 400) && (
                                <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full">
                                    Active
                                </span>
                            )}
                        </span>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-4 pt-4">
                            <Input
                                type="number"
                                value={fpsRange[0]}
                                onChange={(e) => setFpsRange([parseInt(e.target.value), fpsRange[1]])}
                                placeholder="Min FPS"
                                className="w-24 bg-zinc-800"
                            />
                            <Input
                                type="number"
                                value={fpsRange[1]}
                                onChange={(e) => setFpsRange([fpsRange[0], parseInt(e.target.value)])}
                                placeholder="Max FPS"
                                className="w-24 bg-zinc-800"
                            />
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Brand Filter */}
                <AccordionItem value="brand" className="border-zinc-700">
                    <AccordionTrigger className="hover:no-underline">
                        <span className="flex items-center gap-2">
                            Brands
                            {selectedBrands.length > 0 && (
                                <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full">
                                    {selectedBrands.length}
                                </span>
                            )}
                        </span>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-2 pt-4">
                            {brands.map((brand) => (
                                <div key={brand} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={brand}
                                        className="mr-2"
                                        checked={selectedBrands.includes(brand)}
                                        onChange={() => {
                                            if (selectedBrands.includes(brand)) {
                                                setSelectedBrands(selectedBrands.filter(b => b !== brand));
                                            } else {
                                                setSelectedBrands([...selectedBrands, brand]);
                                            }
                                        }}
                                    />
                                    <label htmlFor={brand} className="text-sm">{brand}</label>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Type Filter */}
                <AccordionItem value="type" className="border-zinc-700">
                    <AccordionTrigger className="hover:no-underline">
                        <span className="flex items-center gap-2">
                            Types
                            {selectedTypes.length > 0 && (
                                <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full">
                                    {selectedTypes.length}
                                </span>
                            )}
                        </span>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-2 pt-4">
                            {powerTypes.map((type) => (
                                <div key={type} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={type}
                                        className="mr-2"
                                        checked={selectedTypes.includes(type)}
                                        onChange={() => {
                                            if (selectedTypes.includes(type)) {
                                                setSelectedTypes(selectedTypes.filter(t => t !== type));
                                            } else {
                                                setSelectedTypes([...selectedTypes, type]);
                                            }
                                        }}
                                    />
                                    <label htmlFor={type} className="text-sm">{type}</label>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )

    return (
        <div className="min-h-screen bg-zinc-900 md:pt-16">
            {/* Search Header */}
            <div className="border-b border-zinc-800">
                <div className="container mx-auto px-4 py-8">
                    <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
                        <div className="relative">
                            <Input
                                type="text"
                                placeholder="Search for products..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="w-full h-12 pl-12 pr-4 bg-zinc-800/50 border-zinc-700"
                            />
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400" />
                            <Button
                                type="submit"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-green-600"
                            >
                                Search
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Search Content */}
            <div className="container mx-auto px-4 py-8">
                {!query ? (
                    // Show recent & saved searches when no query
                    <div className="max-w-2xl mx-auto">
                        <Tabs defaultValue="recent" className="w-full">
                            <TabsList className="w-full bg-zinc-800/50">
                                <TabsTrigger value="recent" className="flex-1">
                                    <History className="w-4 h-4 mr-2" />
                                    Recent Searches
                                </TabsTrigger>
                                <TabsTrigger value="saved" className="flex-1">
                                    <Bookmark className="w-4 h-4 mr-2" />
                                    Saved Searches
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="recent" className="mt-4">
                                <Card className="bg-zinc-800/50 border-zinc-700">
                                    <CardContent className="p-6">
                                        <div className="space-y-4">
                                            {recentSearches.map((search, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between group hover:bg-zinc-700/50 p-2 rounded-lg transition-colors"
                                                >
                                                    <Link
                                                        href={`/search?q=${encodeURIComponent(search)}`}
                                                        className="flex-1 text-zinc-400 hover:text-white"
                                                    >
                                                        {search}
                                                    </Link>
                                                    <BookmarkPlus className="w-4 h-4 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-green-500 cursor-pointer" />
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="saved" className="mt-4">
                                <Card className="bg-zinc-800/50 border-zinc-700">
                                    <CardContent className="p-6">
                                        <div className="space-y-4">
                                            {savedSearches.map((search) => (
                                                <div
                                                    key={search.id}
                                                    className="p-4 border border-zinc-700 rounded-lg hover:border-green-500/50 transition-colors"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <Link
                                                            href={`/search?q=${encodeURIComponent(search.query)}`}
                                                            className="text-lg font-medium hover:text-green-500"
                                                        >
                                                            {search.query}
                                                        </Link>
                                                        <Button variant="ghost" size="sm">
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {Object.entries(search.filters).map(([key, value]) => (
                                                            <span
                                                                key={key}
                                                                className="text-xs bg-zinc-700 text-zinc-300 px-2 py-1 rounded-full"
                                                            >
                                                                {key}: {value.toString()}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                ) : (
                    // Show search results
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Filters Sidebar */}
                        <div className="hidden lg:block">
                            <Card className="bg-zinc-800/50 border-zinc-700 sticky top-24">
                                <CardContent className="p-6">
                                    <Suspense fallback={<div>Loading filters...</div>}>
                                        <FilterContent />
                                    </Suspense>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Results */}
                        <div className="lg:col-span-3">
                            {/* Results Header */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                <div>
                                    <h2 className="text-xl font-semibold mb-1">
                                        Results for &quot;{query}&quot;
                                    </h2>
                                    <p className="text-zinc-400">
                                        {products.length} products found
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-zinc-700"
                                        onClick={saveSearch}
                                    >
                                        <BookmarkPlus className="w-4 h-4 mr-2" />
                                        Save Search
                                    </Button>

                                    <Sheet>
                                        <SheetTrigger asChild>
                                            <Button variant="outline" size="sm" className="border-zinc-700 lg:hidden">
                                                <Filter className="w-4 h-4" />
                                            </Button>
                                        </SheetTrigger>
                                        <SheetContent side="left" className="w-full sm:w-80 bg-zinc-900 border-zinc-800">
                                            {/* Filter Content Component */}
                                        </SheetContent>
                                    </Sheet>
                                </div>
                            </div>

                            {/* Sort Controls */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Select value={sortBy} onValueChange={setSortBy}>
                                        <SelectTrigger className="w-full sm:w-[180px] bg-zinc-800/50 border-zinc-700">
                                        <SelectValue placeholder="Sort by" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="relevance">Most Relevant</SelectItem>
                                        <SelectItem value="price_asc">Price: Low to High</SelectItem>
                                        <SelectItem value="price_desc">Price: High to Low</SelectItem>
                                        <SelectItem value="rating">Best Rating</SelectItem>
                                    </SelectContent>
                                </Select>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                            className={`border-zinc-700 ${view === 'grid' ? 'bg-green-500/20 text-green-500' : ''}`}
                                        onClick={() => setView('grid')}
                                    >
                                        Grid
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                            className={`border-zinc-700 ${view === 'list' ? 'bg-green-500/20 text-green-500' : ''}`}
                                        onClick={() => setView('list')}
                                    >
                                        List
                                    </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Results Grid/List */}
                            {isLoading ? (
                                <div className="flex items-center justify-center h-96">
                                    <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                                </div>
                            ) : (
                                <>
                                    {view === 'grid' ? (
                                        // Grid View
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {currentProducts.map((product) => (
                                                <ProductCard 
                                                    key={product.id}
                                                    product={product}
                                                    onCompare={handleCompare}
                                                    onTrackPrice={handleTrackPrice}
                                                    onSave={handleSave}
                                                    onViewDetails={handleViewDetails}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        // List View
                                        <div className="space-y-3">
                                            {currentProducts.map((product) => (
                                                <Link key={product.id} href={`/product/${product.id}`}>
                                            <Card className="bg-zinc-800/50 border-zinc-700 hover:border-green-500/50 transition-colors">
                                                        <CardContent className="p-4">
                                                            <div className="flex flex-col sm:flex-row gap-4">
                                                                {/* Product Image */}
                                                                <div className="w-full sm:w-40 lg:w-48 h-24 sm:h-32 flex-shrink-0">
                                                                    <Image
                                                                        src={product.images[0] || ''}
                                                                        alt={product.name}
                                                                        className="w-full h-full object-cover rounded-lg"
                                                                        width={192}
                                                                        height={128}
                                                                    />
                                                                </div>
                                                                
                                                                {/* Product Details */}
                                                                <div className="flex-grow flex flex-col">
                                                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                                                                        <div>
                                                                            <h3 className="font-semibold mb-1 text-sm sm:text-base line-clamp-1">{product.name}</h3>
                                                                            <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-xs text-zinc-400">{product.type.toUpperCase()}</span>
                                                                                <span className="text-xs text-zinc-400">•</span>
                                                                                <span className="text-xs text-zinc-400">{product.brand}</span>
                                                                            </div>
                                                        </div>
                                                                        <div className="text-left sm:text-right">
                                                                            <p className="text-base sm:text-lg font-bold">${product.lowestPrice}</p>
                                                                {product.lowestPrice !== product.highestPrice && (
                                                                    <p className="text-xs text-zinc-400">
                                                                        to ${product.highestPrice}
                                                                    </p>
                                                                )}
                                                            </div>
                                                                    </div>
                                                                    
                                                                    <div className="mt-auto flex justify-between">
                                                                        <div className="flex items-center">
                                                                            <p className="text-xs sm:text-sm text-zinc-400 mr-2">{product.stores.length} stores</p>
                                                                            <p className={`text-xs sm:text-sm ${product.inStock ? 'text-green-500' : 'text-red-500'}`}>
                                                                                {product.inStock ? 'In Stock' : 'Out of Stock'}
                                                                            </p>
                                                                        </div>
                                                                        
                                                                        {/* Quick Actions - Mobile Optimized */}
                                                                        <div className="flex space-x-3">
                                                                            <div 
                                                                                className="flex flex-col items-center justify-center cursor-pointer group"
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    handleCompare(product.id, e);
                                                                                }}
                                                                            >
                                                                                <BarChart2 className="h-4 w-4 text-zinc-400 group-hover:text-green-500 transition-colors" />
                                                                            </div>
                                                                            <div 
                                                                                className="flex flex-col items-center justify-center cursor-pointer group"
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    handleTrackPrice(product.id, e);
                                                                                }}
                                                                            >
                                                                                <Bell className="h-4 w-4 text-zinc-400 group-hover:text-green-500 transition-colors" />
                                                                            </div>
                                                                            <div 
                                                                                className="flex flex-col items-center justify-center cursor-pointer group"
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    handleSave(product.id, e);
                                                                                }}
                                                                            >
                                                                                <Bookmark className="h-4 w-4 text-zinc-400 group-hover:text-green-500 transition-colors" />
                                                                            </div>
                                                                            <div 
                                                                                className="flex flex-col items-center justify-center cursor-pointer group"
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    handleViewDetails(product.id, e);
                                                                                }}
                                                                            >
                                                                                <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-green-500 transition-colors" />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {/* Action Labels - Visible only on desktop */}
                                                                    <div className="hidden sm:flex sm:justify-end sm:mt-2 sm:space-x-4 sm:text-xs sm:text-zinc-400">
                                                                        <span>Compare</span>
                                                                        <span>Track</span>
                                                                        <span>Save</span>
                                                                        <span>Details</span>
                                                                    </div>
                                                                </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    ))}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-center mt-8">
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="border-zinc-700"
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="border-zinc-700"
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage(currentPage + 1)}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-zinc-900 md:pt-16 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            </div>
        }>
            <SearchContent />
        </Suspense>
    )
}