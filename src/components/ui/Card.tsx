'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glow'
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl bg-card text-card-foreground transition-all duration-200',
          {
            'border border-default shadow-card': variant === 'default',
            'border border-default shadow-soft': variant === 'elevated',
            'border-2 border-default': variant === 'outlined',
            'border border-default shadow-soft hover:shadow-glow': variant === 'glow',
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('font-display text-xl font-semibold leading-none tracking-tight text-foreground', className)}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
)
CardDescription.displayName = 'CardDescription'

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
