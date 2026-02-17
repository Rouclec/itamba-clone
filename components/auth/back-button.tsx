'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

interface BackButtonProps {
  label?: string
  className?: string
}

export function BackButton({ label = 'Back', className = '' }: BackButtonProps) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.back()}
      className={`flex items-center gap-2 text-primary hover:text-primary/80 transition-colors group mb-6 ${className}`}
    >
      <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}
