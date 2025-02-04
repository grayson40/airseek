'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
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
    Slider
} from "@/components/ui/slider"
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
    Filter,
    X,
    Loader2
} from 'lucide-react'
import type { Product } from '@/types'

// Mock data
const brands = ['Tokyo Marui', 'KWA', 'VFC', 'G&G', 'Krytac', 'Classic Army', 'Umarex', 'ASG']

// platforms
const platforms = {
    pistol: ['glock', 'hi_capa', 'm1911', 'p226', 'beretta', 'cz', 'usp'],
    rifle: ['m4', 'sr25', 'ak', 'scar', 'g36', 'famas', 'aug'],
    smg: ['mp5', 'kriss'],
    sniper: ['bolt_action', 'dmr'],
    lmg: ['m249', 'm60'],
    parts: [],
    gear: []
} as const;

// power types
const powerTypes = [
    'aeg', 'gbbr', 'gbb_pistol', 'spring', 'hpa', 'co2', 'aep'
];

// Helper function to get available platforms for a category
const getPlatformsForCategory = (category: string | string[] | undefined) => {
    if (!category) return [];
    const normalized = category.toString().toLowerCase().replace(/s$/, '');
    return platforms[normalized as keyof typeof platforms] || [];
};

export default function CategoryPage() {
    const router = useRouter()
    const params = useParams()

    // State
    const [isLoading, setIsLoading] = useState(true)
    const [products, setProducts] = useState<Product[]>([])
    const [priceRange, setPriceRange] = useState([0, 1000])
    const [fpsRange, setFpsRange] = useState([200, 400])
    const [selectedBrands, setSelectedBrands] = useState<string[]>([])
    const [selectedTypes, setSelectedTypes] = useState<string[]>([])
    const [sortBy, setSortBy] = useState("price_asc")
    const [showCount, setShowCount] = useState("24")
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
    const [selectedPowerTypes, setSelectedPowerTypes] = useState<string[]>([])

    // Fetch products from the API
    useEffect(() => {
        const category = params.id ? params.id.slice(0, -1) : 'rifle';
        const fetchProducts = async () => {
            setIsLoading(true)
            try {
                const response = await fetch(`/api/products?category=${category}`)
                if (!response.ok) {
                    throw new Error('Failed to fetch products')
                }
                const data = await response.json()
                setProducts(data)
            } catch (error) {
                console.error('Error fetching products:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchProducts()
    }, [params.id])

    // Update URL with filters
    useEffect(() => {
        const params = new URLSearchParams()
        if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString())
        if (priceRange[1] < 1000) params.set('maxPrice', priceRange[1].toString())
        if (selectedBrands.length) params.set('brands', selectedBrands.join(','))
        if (selectedTypes.length) params.set('types', selectedTypes.join(','))
        if (sortBy !== 'price_asc') params.set('sort', sortBy)
        if (currentPage > 1) params.set('page', currentPage.toString())

        router.push(`?${params.toString()}`, { scroll: false })
    }, [priceRange, selectedBrands, selectedTypes, sortBy, currentPage])

    // Filter logic
    const filteredProducts = products.filter(product => {
        const priceMatch = product.stores.some(store => store.price >= priceRange[0] && store.price <= priceRange[1]);
        const fpsMatch = product.fps.max >= fpsRange[0] && product.fps.max <= fpsRange[1];
        const brandMatch = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
        const platformMatch = selectedPlatforms.length === 0 || selectedPlatforms.includes(product.platform);
        const powerTypeMatch = selectedPowerTypes.length === 0 || selectedPowerTypes.includes(product.type);

        return priceMatch && fpsMatch && brandMatch && platformMatch && powerTypeMatch;
    }).sort((a, b) => {
        switch (sortBy) {
            case "price_asc": return Math.min(...a.stores.map(store => store.price)) - Math.min(...b.stores.map(store => store.price))
            case "price_desc": return Math.max(...b.stores.map(store => store.price)) - Math.max(...a.stores.map(store => store.price))
            case "rating":
                return (Math.max(...b.stores.map(store => store.rating)) || 0) - (Math.max(...a.stores.map(store => store.rating)) || 0)
            default: return 0
        }
    })

    // Calculate lowest and highest prices from stores
    const productsWithPriceRange = filteredProducts.map(product => {
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

    // Reset filters
    const resetFilters = () => {
        setPriceRange([0, 1000]);
        setFpsRange([200, 400]);
        setSelectedBrands([]);
        setSelectedPlatforms([]);
        setSelectedPowerTypes([]);
        setSortBy("price_asc");
        setCurrentPage(1);
    };

    // Filter panel component - shared between desktop and mobile
    const FilterContent = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Filters</h2>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
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
                            <Slider
                                value={priceRange}
                                max={1000}
                                step={10}
                                onValueChange={setPriceRange}
                                className="mt-6"
                            />
                            <div className="flex justify-between items-center gap-4">
                                <Input
                                    type="number"
                                    value={priceRange[0]}
                                    onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                                    className="w-24 bg-zinc-800"
                                />
                                <span className="text-zinc-400">to</span>
                                <Input
                                    type="number"
                                    value={priceRange[1]}
                                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                                    className="w-24 bg-zinc-800"
                                />
                            </div>
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
                            <Slider
                                value={fpsRange}
                                min={200}
                                max={500}
                                step={10}
                                onValueChange={setFpsRange}
                                className="mt-6"
                            />
                            <div className="flex justify-between items-center gap-4">
                                <Input
                                    type="number"
                                    value={fpsRange[0]}
                                    onChange={(e) => setFpsRange([parseInt(e.target.value), fpsRange[1]])}
                                    className="w-24 bg-zinc-800"
                                />
                                <span className="text-zinc-400">to</span>
                                <Input
                                    type="number"
                                    value={fpsRange[1]}
                                    onChange={(e) => setFpsRange([fpsRange[0], parseInt(e.target.value)])}
                                    className="w-24 bg-zinc-800"
                                />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Brand Filter */}
                <AccordionItem value="brand" className="border-zinc-700">
                    <AccordionTrigger className="hover:no-underline">
                        <span className="flex items-center gap-2">
                            Brand
                            {selectedBrands.length > 0 && (
                                <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full">
                                    {selectedBrands.length}
                                </span>
                            )}
                        </span>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-2 pt-4">
                            {brands.map((brand) => {
                                const count = products.filter(p => p.brand === brand).length
                                return (
                                    <div key={brand} className="flex items-center justify-between group">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={brand}
                                                className="mr-2"
                                                checked={selectedBrands.includes(brand)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedBrands([...selectedBrands, brand])
                                                    } else {
                                                        setSelectedBrands(selectedBrands.filter(b => b !== brand))
                                                    }
                                                }}
                                            />
                                            <label htmlFor={brand} className="text-sm">{brand}</label>
                                        </div>
                                        <span className="text-xs text-zinc-500 group-hover:text-zinc-400">
                                            ({count})
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Platform Filter */}
                <AccordionItem value="platform" className="border-zinc-700">
                    <AccordionTrigger className="hover:no-underline">
                        <span className="flex items-center gap-2">
                            Platform
                            {selectedPlatforms.length > 0 && (
                                <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full">
                                    {selectedPlatforms.length}
                                </span>
                            )}
                        </span>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-2 pt-4">
                            {getPlatformsForCategory(params.id).map((platform) => {
                                const count = products.filter(p => p.platform === platform).length;
                                return (
                                    <div key={platform} className="flex items-center justify-between group">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={platform}
                                                className="mr-2"
                                                checked={selectedPlatforms.includes(platform)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedPlatforms([...selectedPlatforms, platform]);
                                                    } else {
                                                        setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
                                                    }
                                                }}
                                            />
                                            <label htmlFor={platform} className="text-sm">
                                                {/* Convert display text to Title Case */}
                                                {platform.split('_').map(word =>
                                                    word.charAt(0).toUpperCase() + word.slice(1)
                                                ).join(' ')}
                                            </label>
                                        </div>
                                        <span className="text-xs text-zinc-500 group-hover:text-zinc-400">
                                            ({count})
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Power Type Filter */}
                <AccordionItem value="powerType" className="border-zinc-700">
                    <AccordionTrigger className="hover:no-underline">
                        <span className="flex items-center gap-2">
                            Power Type
                            {selectedPowerTypes.length > 0 && (
                                <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full">
                                    {selectedPowerTypes.length}
                                </span>
                            )}
                        </span>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-2 pt-4">
                            {powerTypes.map((type) => {
                                const count = products.filter(p => p.type === type).length;
                                return (
                                    <div key={type} className="flex items-center justify-between group">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={type}
                                                className="mr-2"
                                                checked={selectedPowerTypes.includes(type)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedPowerTypes([...selectedPowerTypes, type]);
                                                    } else {
                                                        setSelectedPowerTypes(selectedPowerTypes.filter(t => t !== type));
                                                    }
                                                }}
                                            />
                                            <label htmlFor={type} className="text-sm">
                                                {type.split('_').map(word =>
                                                    word.toUpperCase()
                                                ).join(' ')}
                                            </label>
                                        </div>
                                        <span className="text-xs text-zinc-500 group-hover:text-zinc-400">
                                            ({count})
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )

    return (
        <div className="min-h-screen bg-zinc-900 md:pt-20">
            {/* Category Header */}
            <div className="border-b border-zinc-800">
                <div className="container mx-auto px-4 md:py-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold mb-2 capitalize">{params.id}</h1>
                            <p className="text-zinc-400">
                                {productsWithPriceRange.length} products found
                            </p>
                        </div>

                        {/* Active Filters */}
                        <div className="flex flex-wrap gap-2">
                            {selectedPlatforms.map(platform => (
                                <Button
                                    key={platform}
                                    variant="outline"
                                    size="sm"
                                    className="h-7 border-green-500/50 text-green-500 hover:bg-green-500/10"
                                    onClick={() => setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform))}
                                >
                                    {platform.replace('_', ' ')}
                                    <X className="ml-2 h-3 w-3" />
                                </Button>
                            ))}
                            {selectedPowerTypes.map(type => (
                                <Button
                                    key={type}
                                    variant="outline"
                                    size="sm"
                                    className="h-7 border-green-500/50 text-green-500 hover:bg-green-500/10"
                                    onClick={() => setSelectedPowerTypes(selectedPowerTypes.filter(t => t !== type))}
                                >
                                    {type.replace('_', ' ')}
                                    <X className="ml-2 h-3 w-3" />
                                </Button>
                            ))}
                            {selectedBrands.map(brand => (
                                <Button
                                    key={brand}
                                    variant="outline"
                                    size="sm"
                                    className="h-7 border-green-500/50 text-green-500 hover:bg-green-500/10"
                                    onClick={() => setSelectedBrands(selectedBrands.filter(b => b !== brand))}
                                >
                                    {brand}
                                    <X className="ml-2 h-3 w-3" />
                                </Button>
                            ))}
                            {selectedTypes.map(type => (
                                <Button
                                    key={type}
                                    variant="outline"
                                    size="sm"
                                    className="h-7 border-green-500/50 text-green-500 hover:bg-green-500/10"
                                    onClick={() => setSelectedTypes(selectedTypes.filter(t => t !== type))}
                                >
                                    {type}
                                    <X className="ml-2 h-3 w-3" />
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Desktop Filters */}
                    <div className="hidden lg:block">
                        <Card className="bg-zinc-800/50 border-zinc-700 sticky top-24">
                            <CardContent className="p-6">
                                <FilterContent />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Product Grid with Mobile Controls */}
                    <div className="lg:col-span-3">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-full sm:w-[180px] bg-zinc-800/50 border-zinc-700">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                                    <SelectItem value="rating">Best Rating</SelectItem>
                                    <SelectItem value="reviews">Most Reviews</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Mobile Filters */}
                            <div className="flex w-full sm:w-auto gap-2">
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <Button variant="outline" size="sm" className="border-zinc-700 w-full sm:w-auto">
                                            <Filter className="h-4 w-4 mr-2" />
                                            Filters {(selectedBrands.length > 0 || selectedTypes.length > 0) &&
                                                `(${selectedBrands.length + selectedTypes.length})`}
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="left" className="w-full sm:w-80 bg-zinc-900 border-zinc-800">
                                        <FilterContent />
                                    </SheetContent>
                                </Sheet>

                                <Select value={showCount} onValueChange={setShowCount}>
                                    <SelectTrigger className="w-[100px] bg-zinc-800/50 border-zinc-700">
                                        <SelectValue placeholder="Show" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="12">12 Items</SelectItem>
                                        <SelectItem value="24">24 Items</SelectItem>
                                        <SelectItem value="48">48 Items</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Products Grid */}
                        {isLoading ? (
                            <div className="flex items-center justify-center h-96">
                                <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {productsWithPriceRange.map((product: Product) => (
                                        <Link href={`/product/${product.id}`} key={product.id}>
                                            <Card className="bg-zinc-800/50 border-zinc-700 hover:border-green-500/50 transition-colors">
                                                <CardContent className="p-4">
                                                    <img
                                                        src={product.images[0] || ''}
                                                        alt={product.name}
                                                        className="w-full h-48 object-cover rounded-lg mb-4"
                                                    />
                                                    <h3 className="font-semibold mb-2">{product.name}</h3>

                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-xs text-zinc-400">{product.type.toUpperCase()}</span>
                                                    </div>

                                                    <div className="flex justify-between items-end">
                                                        <div>
                                                            <p className="text-lg font-bold">${product.lowestPrice}</p>
                                                            {product.lowestPrice !== product.highestPrice && (
                                                                <p className="text-xs text-zinc-400">
                                                                    to ${product.highestPrice}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm text-zinc-400">{product.stores.length} stores</p>
                                                            <p className={`text-sm ${product.inStock ? 'text-green-500' : 'text-red-500'}`}>
                                                                {product.inStock ? 'In Stock' : 'Out of Stock'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {productsWithPriceRange.length > 0 && (
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
                                                disabled={currentPage === Math.ceil(productsWithPriceRange.length / parseInt(showCount))}
                                                onClick={() => setCurrentPage(currentPage + 1)}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* No Results */}
                                {productsWithPriceRange.length === 0 && (
                                    <div className="text-center py-12">
                                        <p className="text-zinc-400 mb-4">No products match your filters</p>
                                        <Button
                                            variant="outline"
                                            className="border-zinc-700"
                                            onClick={resetFilters}
                                        >
                                            Reset Filters
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}