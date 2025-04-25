'use client'

import Link from 'next/link'
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from 'lucide-react'
import { ProductCategories } from '@/types'
const navItems = {
    'Categories': Object.values(ProductCategories),
    'Deals': [
        'Weekly Deals',
        'Clearance',
        'Bundle Deals'
    ],
    'Trending': [
        'New Arrivals',
        'Most Popular',
        'Featured'
    ],
}

export function Navbar() {
    const MobileMenu = ({ onLinkClick }: { onLinkClick: () => void }) => (
        <div className="space-y-6 p-4">
            {Object.entries(navItems).map(([category, items]) => (
                <div key={category} className="border-b border-zinc-800 pb-4 last:border-0">
                    <h2 className="font-bold text-lg mb-4">{category}</h2>
                    <div className="space-y-2">
                        {items.map((item) => (
                            <Link
                                key={item}
                                href={item === 'Weekly Deals' 
                                    ? '/deals/weekly-deals' 
                                    : `/${category.toLowerCase()}/${item.toLowerCase().replace(/\s+/g, '-')}`}
                                className="text-sm text-zinc-400 hover:text-green-500 block py-1"
                                onClick={onLinkClick} // Close sheet on link click
                            >
                                {item}
                            </Link>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )

    return (
        <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl fixed w-full z-50">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between gap-6">
                    <Link href="/" className="text-xl font-bold text-green-500">
                        AirSeek
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:block">
                        <NavigationMenu>
                            <NavigationMenuList>
                                {Object.entries(navItems).map(([category, items]) => (
                                    <NavigationMenuItem key={category}>
                                        <NavigationMenuTrigger className="bg-transparent">
                                            {category}
                                        </NavigationMenuTrigger>
                                        <NavigationMenuContent>
                                            <div className="p-4 w-48">
                                                {items.map((item) => (
                                                    <Link
                                                        key={item}
                                                        href={item === 'Weekly Deals' 
                                                            ? '/deals/weekly-deals' 
                                                            : `/${category.toLowerCase()}/${item.toLowerCase().replace(/\s+/g, '-')}`}
                                                        className="block text-sm text-zinc-400 hover:text-green-500 py-2"
                                                    >
                                                        {item}
                                                    </Link>
                                                ))}
                                            </div>
                                        </NavigationMenuContent>
                                    </NavigationMenuItem>
                                ))}
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>

                    {/* Mobile Menu */}
                    <div className="md:hidden">
                        <Sheet>
                            <SheetTrigger>
                                <Menu className="h-6 w-6 text-zinc-400" />
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[300px] bg-zinc-900 border-zinc-800">
                                <MobileMenu onLinkClick={() => {
                                    // Close the sheet when a link is clicked
                                    const closeButton = document.querySelector('.absolute.right-4.top-4.rounded-sm.opacity-70');
                                    if (closeButton) {
                                        closeButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                                    }
                                }} />
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </nav>
    )
}