'use client'

import { useTransition, ReactNode, useRef, useEffect } from 'react'
import { useToast } from './ui/Toast'
import { useRouter } from 'next/navigation'

interface FormWithToastProps {
  action: (formData: FormData) => Promise<void>
  successMessage: string
  errorMessage?: string
  redirectTo?: string
  children: ReactNode
  className?: string
  resetOnSuccess?: boolean
}

export default function FormWithToast({
  action,
  successMessage,
  errorMessage = 'An error occurred',
  redirectTo,
  children,
  className,
  resetOnSuccess = true
}: FormWithToastProps) {
  const [isPending, startTransition] = useTransition()
  const toast = useToast()
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      try {
        await action(formData)
        toast.success(successMessage)
        if (resetOnSuccess && formRef.current) {
          formRef.current.reset()
        }
        if (redirectTo) {
          router.push(redirectTo)
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : errorMessage)
      }
    })
  }

  return (
    <form ref={formRef} action={handleSubmit} className={className}>
      {children}
    </form>
  )
}
