'use client'

import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import ComparePageContent from './ComparePageContent'

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-900 pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    }>
      <ComparePageContent />
    </Suspense>
  )
} 