'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange?: (count: number) => void
  itemsPerPageOptions?: number[]
  className?: string
  showItemsPerPage?: boolean
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 25, 50, 100],
  className,
  showItemsPerPage = true
}: PaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < totalPages

  const buttonClass = cn(
    'p-2 rounded-lg transition-colors',
    'hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/30',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent'
  )

  return (
    <div className={cn(
      'flex flex-col sm:flex-row items-center justify-between gap-4 py-3',
      className
    )}>
      {/* Items info */}
      <div className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{startItem}</span> to{' '}
        <span className="font-medium text-foreground">{endItem}</span> of{' '}
        <span className="font-medium text-foreground">{totalItems}</span> items
      </div>

      <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-center sm:justify-end">
        {/* Items per page selector */}
        {showItemsPerPage && onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className={cn(
                'px-2 py-1 text-sm rounded-lg border border-input bg-background',
                'focus:outline-none focus:ring-2 focus:ring-primary/30',
                'text-foreground'
              )}
            >
              {itemsPerPageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Page navigation */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* First page - hidden on mobile */}
          <button
            onClick={() => onPageChange(1)}
            disabled={!canGoPrevious}
            className={cn(buttonClass, 'hidden sm:block')}
            title="First page"
          >
            <ChevronsLeft size={18} className="text-muted-foreground" />
          </button>

          {/* Previous page */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!canGoPrevious}
            className={buttonClass}
            title="Previous page"
          >
            <ChevronLeft size={18} className="text-muted-foreground" />
          </button>

          {/* Page indicator */}
          <div className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">
            {currentPage} / {totalPages || 1}
          </div>

          {/* Next page */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!canGoNext}
            className={buttonClass}
            title="Next page"
          >
            <ChevronRight size={18} className="text-muted-foreground" />
          </button>

          {/* Last page - hidden on mobile */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={!canGoNext}
            className={cn(buttonClass, 'hidden sm:block')}
            title="Last page"
          >
            <ChevronsRight size={18} className="text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  )
}

export type { PaginationProps }
