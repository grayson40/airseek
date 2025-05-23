import Link from 'next/link'
import Image from 'next/image'
import { BarChart2, Bell, Bookmark, ArrowRight } from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product & {
    lowestPrice: number;
    highestPrice: number;
    inStock: boolean;
    rating: number;
    reviews: number;
  };
  onCompare?: (productId: string | number, e: React.MouseEvent) => void;
  onTrackPrice?: (productId: string | number, e: React.MouseEvent) => void;
  onSave?: (productId: string | number, e: React.MouseEvent) => void;
  onViewDetails?: (productId: string | number, e: React.MouseEvent) => void;
  isComparing?: boolean;
  compact?: boolean;
}

export function ProductCard({ 
  product,
  onCompare = () => {},
  onTrackPrice = () => {},
  onSave = () => {},
  onViewDetails = () => {},
  isComparing = false,
  compact = false
}: ProductCardProps) {
  
  if (compact) {
    return (
      <Link href={`/product/${product.id}`}>
        <Card className="bg-zinc-800/50 border-zinc-700 hover:border-green-500/50 transition-colors h-full">
          <CardContent className="p-3 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden">
                <Image
                  src={product.images[0] || ''}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  width={64}
                  height={64}
                />
              </div>
              <div className="flex-grow min-w-0">
                <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-zinc-400">{product.type.toUpperCase()}</span>
                  <span className="text-xs text-zinc-400">•</span>
                  <span className="text-xs text-zinc-400">{product.brand}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-auto">
              <div>
                <p className="text-sm font-bold">${product.lowestPrice}</p>
                {product.lowestPrice !== product.highestPrice && (
                  <p className="text-xs text-zinc-400">
                    to ${product.highestPrice}
                  </p>
                )}
              </div>
              <p className={`text-xs ${product.inStock ? 'text-green-500' : 'text-red-500'}`}>
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="mt-2 grid grid-cols-4 gap-1 border-t border-zinc-700 pt-2">
              <div 
                className={`flex items-center justify-center cursor-pointer group p-1 rounded-sm ${isComparing ? 'bg-green-500/20' : 'hover:bg-zinc-700/50'}`}
                onClick={(e) => {
                  e.preventDefault();
                  onCompare(product.id, e);
                }}
              >
                <BarChart2 className={`h-3.5 w-3.5 ${isComparing ? 'text-green-500' : 'text-zinc-400 group-hover:text-green-500'}`} />
              </div>
              <div 
                className="flex items-center justify-center cursor-pointer group p-1 rounded-sm hover:bg-zinc-700/50"
                onClick={(e) => {
                  e.preventDefault();
                  onTrackPrice(product.id, e);
                }}
              >
                <Bell className="h-3.5 w-3.5 text-zinc-400 group-hover:text-green-500" />
              </div>
              <div 
                className="flex items-center justify-center cursor-pointer group p-1 rounded-sm hover:bg-zinc-700/50"
                onClick={(e) => {
                  e.preventDefault();
                  onSave(product.id, e);
                }}
              >
                <Bookmark className="h-3.5 w-3.5 text-zinc-400 group-hover:text-green-500" />
              </div>
              <div 
                className="flex items-center justify-center cursor-pointer group p-1 rounded-sm hover:bg-zinc-700/50"
                onClick={(e) => {
                  e.preventDefault();
                  onViewDetails(product.id, e);
                }}
              >
                <ArrowRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }
  
  return (
    <Link href={`/product/${product.id}`}>
      <Card className="bg-zinc-800/50 border-zinc-700 hover:border-green-500/50 transition-colors h-full">
        <CardContent className="p-4 flex flex-col h-full">
          <Image
            src={product.images[0] || ''}
            alt={product.name}
            className="w-full h-48 object-cover rounded-lg mb-4"
            width={400}
            height={192}
          />
          <h3 className="font-semibold mb-2">{product.name}</h3>

          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-zinc-400">{product.type.toUpperCase()}</span>
          </div>

          <div className="flex justify-between items-end mt-auto">
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
          
          {/* Quick Actions */}
          <div className="mt-4 grid grid-cols-4 gap-2 border-t border-zinc-700 pt-3">
            <div 
              className={`flex flex-col items-center justify-center cursor-pointer group ${isComparing ? 'text-green-500' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                onCompare(product.id, e);
              }}
            >
              <BarChart2 className={`h-4 w-4 mb-1 ${isComparing ? 'text-green-500' : 'text-zinc-400 group-hover:text-green-500'} transition-colors`} />
              <span className={`text-xs ${isComparing ? 'text-green-500' : 'text-zinc-400 group-hover:text-green-500'} transition-colors`}>Compare</span>
            </div>
            <div 
              className="flex flex-col items-center justify-center cursor-pointer group"
              onClick={(e) => {
                e.preventDefault();
                onTrackPrice(product.id, e);
              }}
            >
              <Bell className="h-4 w-4 mb-1 text-zinc-400 group-hover:text-green-500 transition-colors" />
              <span className="text-xs text-zinc-400 group-hover:text-green-500 transition-colors">Track</span>
            </div>
            <div 
              className="flex flex-col items-center justify-center cursor-pointer group"
              onClick={(e) => {
                e.preventDefault();
                onSave(product.id, e);
              }}
            >
              <Bookmark className="h-4 w-4 mb-1 text-zinc-400 group-hover:text-green-500 transition-colors" />
              <span className="text-xs text-zinc-400 group-hover:text-green-500 transition-colors">Save</span>
            </div>
            <div 
              className="flex flex-col items-center justify-center cursor-pointer group"
              onClick={(e) => {
                e.preventDefault();
                onViewDetails(product.id, e);
              }}
            >
              <ArrowRight className="h-4 w-4 mb-1 text-zinc-400 group-hover:text-green-500 transition-colors" />
              <span className="text-xs text-zinc-400 group-hover:text-green-500 transition-colors">Details</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
} 