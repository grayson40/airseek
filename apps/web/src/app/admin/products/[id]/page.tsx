import React from 'react';
import Link from 'next/link';
import { EditButton, DeleteButton } from '../../../../components/admin/ClientButtons';
import Image from 'next/image';
// interface Product {
//   id: string;
//   name: string;
//   brand: string;
//   category: string;
//   sku: string;
//   description: string;
//   image_url: string;
//   created_at: string;
//   updated_at: string;
// }

interface StorePrice {
  id: string;
  product_id: string;
  store_name: string;
  price: number;
  url: string;
  in_stock: boolean;
  created_at: string;
  updated_at: string;
}

async function getProductDetails(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/admin/products/${id}`, {
    next: { revalidate: 60 } // Cache for 1 minute
  });
  
  if (!response.ok) {
    console.error(`Error fetching product ${id}:`, response.statusText);
    return null;
  }
  
  const data = await response.json();
  return {
    product: data.product,
    storePrices: data.storePrices || []
  };
}

// Define the proper type for page params in Next.js App Router
type Props = Promise<{ id: string }>;

export default async function ProductDetailPage(props: { params: Props }) {
  const { id } = await props.params;
  const productData = await getProductDetails(id);

  if (!productData) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-semibold text-red-600">Product Not Found</h1>
        <p className="mt-4 text-slate-600">The product you are looking for doesn&apos;t exist or was removed.</p>
        <Link href="/admin/products" className="mt-6 inline-block text-blue-600 hover:text-blue-800 font-medium">
          Return to Products List
        </Link>
      </div>
    );
  }

  const { product, storePrices } = productData;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/admin/products" className="text-blue-600 hover:text-blue-800 flex items-center font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Products
          </Link>
          <h1 className="text-2xl font-semibold mt-2 text-slate-900">{product.name}</h1>
        </div>
        <div className="flex gap-2">
          <EditButton />
          <DeleteButton />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Product Overview */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Product Details</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <p className="text-sm text-slate-500">Brand</p>
                  <p className="font-medium text-slate-900">{product.brand || 'Not specified'}</p>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-slate-500">Category</p>
                  <p className="font-medium text-slate-900">{product.category || 'Not specified'}</p>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-slate-500">SKU</p>
                  <p className="font-medium text-slate-900">{product.sku || 'Not specified'}</p>
                </div>
              </div>
              
              <div>
                <div className="mb-4">
                  <p className="text-sm text-slate-500">Last Updated</p>
                  <p className="font-medium text-slate-900">{new Date(product.updated_at).toLocaleString()}</p>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-slate-500">Created</p>
                  <p className="font-medium text-slate-900">{new Date(product.created_at).toLocaleString()}</p>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-slate-500">Store Count</p>
                  <p className="font-medium text-slate-900">{storePrices.length}</p>
                </div>
              </div>
            </div>
            
            {product.description && (
              <div className="mt-4">
                <p className="text-sm text-slate-500 mb-1">Description</p>
                <p className="text-sm text-slate-700">{product.description}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Product Image */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Product Image</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-center bg-slate-50 rounded-lg p-4 h-48">
              {product.image_url ? (
                <Image
                  src={product.image_url} 
                  alt={product.name} 
                  className="max-h-full max-w-full object-contain"
                  width={600}
                  height={600}
                />
              ) : (
                <div className="text-slate-400 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2">No image available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Store Prices */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Store Prices</h2>
        </div>
        <div className="p-6">
          {storePrices.length === 0 ? (
            <p className="text-slate-500 italic">No store prices available for this product</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Store
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      In Stock
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {storePrices.map((price: StorePrice) => (
                    <tr key={price.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {price.store_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-semibold">
                        ${price.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                          price.in_stock 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {price.in_stock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {new Date(price.updated_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <a 
                          href={price.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Price History Chart placeholder */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mt-6">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Price History</h2>
        </div>
        <div className="p-6">
          <div className="bg-slate-50 rounded-lg p-4 h-64 flex items-center justify-center">
            <p className="text-slate-500">Price history chart would be displayed here</p>
          </div>
        </div>
      </div>
    </div>
  );
} 