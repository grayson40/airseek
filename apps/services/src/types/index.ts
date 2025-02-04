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

export const ProductCategories = {
    RIFLE: 'rifle',
    PISTOL: 'pistol',
    SMG: 'smg',
    SHOTGUN: 'shotgun',
    SNIPER: 'sniper',
    LMG: 'lmg',
    GEAR: 'gear',
    PARTS: 'parts',
} as const

export const ProductTypes = {
    AEG: 'aeg',
    GBBR: 'gbbr',
    GBB_PISTOL: 'gbb_pistol',
    SPRING: 'spring',
    HPA: 'hpa',
    CO2: 'co2',
    AEP: 'aep',
} as const

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