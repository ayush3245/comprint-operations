'use client'

import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type IssueTagColor = 'orange' | 'pink' | 'purple' | 'blue' | 'green' | 'red'

interface IssueTagProps {
  label: string
  selected: boolean
  onToggle: () => void
  color?: IssueTagColor
  disabled?: boolean
  className?: string
}

const colorMap: Record<IssueTagColor, {
  base: string
  selected: string
  hover: string
}> = {
  orange: {
    base: 'border-orange-200 text-orange-700 dark:border-orange-800 dark:text-orange-400',
    selected: 'bg-orange-100 border-orange-400 text-orange-800 dark:bg-orange-500/20 dark:border-orange-500 dark:text-orange-300',
    hover: 'hover:border-orange-300 hover:bg-orange-50 dark:hover:border-orange-600 dark:hover:bg-orange-500/10',
  },
  pink: {
    base: 'border-pink-200 text-pink-700 dark:border-pink-800 dark:text-pink-400',
    selected: 'bg-pink-100 border-pink-400 text-pink-800 dark:bg-pink-500/20 dark:border-pink-500 dark:text-pink-300',
    hover: 'hover:border-pink-300 hover:bg-pink-50 dark:hover:border-pink-600 dark:hover:bg-pink-500/10',
  },
  purple: {
    base: 'border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-400',
    selected: 'bg-purple-100 border-purple-400 text-purple-800 dark:bg-purple-500/20 dark:border-purple-500 dark:text-purple-300',
    hover: 'hover:border-purple-300 hover:bg-purple-50 dark:hover:border-purple-600 dark:hover:bg-purple-500/10',
  },
  blue: {
    base: 'border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400',
    selected: 'bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-500/20 dark:border-blue-500 dark:text-blue-300',
    hover: 'hover:border-blue-300 hover:bg-blue-50 dark:hover:border-blue-600 dark:hover:bg-blue-500/10',
  },
  green: {
    base: 'border-green-200 text-green-700 dark:border-green-800 dark:text-green-400',
    selected: 'bg-green-100 border-green-400 text-green-800 dark:bg-green-500/20 dark:border-green-500 dark:text-green-300',
    hover: 'hover:border-green-300 hover:bg-green-50 dark:hover:border-green-600 dark:hover:bg-green-500/10',
  },
  red: {
    base: 'border-red-200 text-red-700 dark:border-red-800 dark:text-red-400',
    selected: 'bg-red-100 border-red-400 text-red-800 dark:bg-red-500/20 dark:border-red-500 dark:text-red-300',
    hover: 'hover:border-red-300 hover:bg-red-50 dark:hover:border-red-600 dark:hover:bg-red-500/10',
  },
}

const IssueTag = forwardRef<HTMLButtonElement, IssueTagProps>(
  ({ label, selected, onToggle, color = 'orange', disabled = false, className }, ref) => {
    const colors = colorMap[color]

    return (
      <motion.button
        ref={ref}
        type="button"
        onClick={onToggle}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.02 } : undefined}
        whileTap={!disabled ? { scale: 0.98 } : undefined}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50',
          disabled && 'opacity-50 cursor-not-allowed',
          selected ? colors.selected : colors.base,
          !selected && !disabled && colors.hover,
          className
        )}
      >
        {selected && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Check size={14} className="shrink-0" />
          </motion.span>
        )}
        {label}
      </motion.button>
    )
  }
)

IssueTag.displayName = 'IssueTag'

// Issue Tag Group component for managing multiple tags
interface IssueTagGroupProps {
  title: string
  tags: string[]
  selectedTags: string[]
  onToggle: (tag: string) => void
  color?: IssueTagColor
  allowCustom?: boolean
  customValue?: string
  onCustomChange?: (value: string) => void
  className?: string
}

function IssueTagGroup({
  title,
  tags,
  selectedTags,
  onToggle,
  color = 'orange',
  allowCustom = false,
  customValue = '',
  onCustomChange,
  className
}: IssueTagGroupProps) {
  const selectedCount = selectedTags.length

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {selectedCount > 0 && (
          <span className={cn(
            'px-2 py-0.5 rounded-full text-xs font-medium',
            colorMap[color].selected
          )}>
            {selectedCount} selected
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <IssueTag
            key={tag}
            label={tag}
            selected={selectedTags.includes(tag)}
            onToggle={() => onToggle(tag)}
            color={color}
          />
        ))}
      </div>
      {allowCustom && onCustomChange && (
        <input
          type="text"
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value)}
          placeholder="Other (specify)..."
          className={cn(
            'w-full px-3 py-2 text-sm rounded-lg border bg-background',
            'focus:outline-none focus:ring-2 focus:ring-primary/30',
            'placeholder:text-muted-foreground'
          )}
        />
      )}
    </div>
  )
}

export { IssueTag, IssueTagGroup, type IssueTagProps, type IssueTagGroupProps, type IssueTagColor }
