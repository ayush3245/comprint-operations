'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

interface FilterOption {
  value: string
  label: string
  color?: string
}

interface FilterConfig {
  key: string
  label: string
  type: 'select' | 'text' | 'date'
  options?: FilterOption[]
  placeholder?: string
}

interface FilterPanelProps {
  filters: FilterConfig[]
  values: Record<string, string>
  onChange: (key: string, value: string) => void
  onClear: () => void
  className?: string
}

export function FilterPanel({
  filters,
  values,
  onChange,
  onClear,
  className
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const activeFilterCount = Object.values(values).filter(Boolean).length

  return (
    <div className={cn('space-y-3', className)}>
      {/* Toggle Button */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2"
        >
          <Filter size={16} />
          Filters
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
              {activeFilterCount}
            </span>
          )}
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Button>

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={14} className="mr-1" />
            Clear all
          </Button>
        )}
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-muted/50 rounded-xl border border-default">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filters.map((filter) => (
                  <div key={filter.key} className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      {filter.label}
                    </label>

                    {filter.type === 'select' && filter.options && (
                      <select
                        value={values[filter.key] || ''}
                        onChange={(e) => onChange(filter.key, e.target.value)}
                        className={cn(
                          'w-full px-3 py-2 text-sm rounded-lg border border-input bg-background',
                          'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
                          'text-foreground'
                        )}
                      >
                        <option value="">{filter.placeholder || 'All'}</option>
                        {filter.options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {filter.type === 'text' && (
                      <input
                        type="text"
                        value={values[filter.key] || ''}
                        onChange={(e) => onChange(filter.key, e.target.value)}
                        placeholder={filter.placeholder || `Search ${filter.label.toLowerCase()}...`}
                        className={cn(
                          'w-full px-3 py-2 text-sm rounded-lg border border-input bg-background',
                          'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
                          'placeholder:text-muted-foreground text-foreground'
                        )}
                      />
                    )}

                    {filter.type === 'date' && (
                      <input
                        type="date"
                        value={values[filter.key] || ''}
                        onChange={(e) => onChange(filter.key, e.target.value)}
                        className={cn(
                          'w-full px-3 py-2 text-sm rounded-lg border border-input bg-background',
                          'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
                          'text-foreground'
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export type { FilterConfig, FilterOption, FilterPanelProps }
