// Core Types
export interface Product {
    id: number
    name: string
    brand: string
    category: ProductCategory
    platform: ProductPlatform
    type: ProductType
    fps: {
        min: number
        max: number
    }
    images: string[]
    stores: StorePrice[]
    lowestPrice: number
    highestPrice: number
    createdAt: Date
    updatedAt: Date
    inStock: boolean
    popularity: number
    priceHistory: any[]
}

export interface StorePrice {
    id: number
    storeName: string
    price: number
    rating: number
    reviews: number
    shipping: {
        cost: number
        freeThreshold?: number
    }
    inStock: boolean
    url: string
    lastUpdated: Date
}

// Main Categories
export const ProductCategories = {
    AEG: 'AEG',
    GBB_RIFLES: 'GBB_Rifles',
    SNIPER_RIFLES: 'Sniper_Rifles',
    SHOTGUNS: 'Shotguns',
    PISTOLS: 'Pistols',
    GAS_PISTOLS: 'Gas_Pistols',
    SPRING_PISTOLS: 'Spring_Pistols',
    ELECTRIC_PISTOLS: 'Electric_Pistols',
} as const

// Power Types
export const ProductTypes = {
    AEG: 'aeg',
    GBBR: 'gbbr',
    GBB_PISTOL: 'gbb_pistol',
    SPRING: 'spring',
    HPA: 'hpa',
    CO2: 'co2',
    AEP: 'aep',
} as const

// Platforms/Models
export const ProductPlatforms = {
    // Pistol Platforms
    GLOCK: 'glock',
    HI_CAPA: 'hi_capa',
    M1911: 'm1911',
    P226: 'p226',
    BERETTA: 'beretta',
    CZ: 'cz',
    USP: 'usp',
    
    // Rifle Platforms
    M4: 'm4',
    SR25: 'sr25',
    AK: 'ak',
    MP5: 'mp5',
    SCAR: 'scar',
    G36: 'g36',
    FAMAS: 'famas',
    AUG: 'aug',
    KRISS: 'kriss',
    
    // Historical
    WWII: 'wwii',
    
    // Special Categories
    DMR: 'dmr',
    BOLT_ACTION: 'bolt_action',
    OTHER: 'other'
} as const

export type ProductCategory = typeof ProductCategories[keyof typeof ProductCategories]
export type ProductType = typeof ProductTypes[keyof typeof ProductTypes]
export type ProductPlatform = typeof ProductPlatforms[keyof typeof ProductPlatforms]

// Search & Filter
export interface SearchParams {
    query?: string
    category?: ProductCategory
    platform?: ProductPlatform
    type?: ProductType
    priceRange?: {
        min: number
        max: number
    }
    fpsRange?: {
        min: number
        max: number
    }
    inStock?: boolean
    sort?: {
        by: 'price' | 'name' | 'rating'
        order: 'asc' | 'desc'
    }
}

// Scrapers/Scripts
export interface ScrapedProduct {
    name: string;
    brand: string;
    price: number;
    url: string;
    inStock: boolean;
    storeId: string;
    shipping: {
        cost: number;
        freeThreshold?: number;
    }
    imageUrl: string;
    category: string;
    minPrice: number;
    maxPrice: number;
    lastUpdated: string;
    type: string;
}
