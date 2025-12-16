'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}

const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className, ...props }, ref) => (
    <div className="w-full overflow-x-auto rounded-lg border border-default">
      <table
        ref={ref}
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  )
)
Table.displayName = 'Table'

interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn('bg-muted', className)}
      {...props}
    />
  )
)
TableHeader.displayName = 'TableHeader'

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  )
)
TableBody.displayName = 'TableBody'

interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

const TableFooter = forwardRef<HTMLTableSectionElement, TableFooterProps>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn('bg-muted font-medium', className)}
      {...props}
    />
  )
)
TableFooter.displayName = 'TableFooter'

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {}

const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'border-b border-default transition-colors',
        'hover:bg-muted/50 dark:hover:bg-secondary/50',
        'data-[state=selected]:bg-muted',
        className
      )}
      {...props}
    />
  )
)
TableRow.displayName = 'TableRow'

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {}

const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'h-12 px-4 text-left align-middle font-semibold text-muted-foreground',
        '[&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  )
)
TableHead.displayName = 'TableHead'

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}

const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        'p-4 align-middle text-foreground',
        '[&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  )
)
TableCell.displayName = 'TableCell'

interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {}

const TableCaption = forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  ({ className, ...props }, ref) => (
    <caption
      ref={ref}
      className={cn('mt-4 text-sm text-muted-foreground', className)}
      {...props}
    />
  )
)
TableCaption.displayName = 'TableCaption'

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
