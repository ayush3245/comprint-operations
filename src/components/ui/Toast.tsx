'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastDetails {
  title?: string
  details?: Array<{ label: string; value: string }>
}

interface Toast {
  id: string
  type: ToastType
  message: string
  title?: string
  details?: Array<{ label: string; value: string }>
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, options?: ToastDetails) => void
  success: (message: string, options?: ToastDetails) => void
  error: (message: string, options?: ToastDetails) => void
  info: (message: string, options?: ToastDetails) => void
  warning: (message: string, options?: ToastDetails) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    bgLight: 'bg-green-50',
    bgDark: 'dark:bg-green-950/50',
    borderColor: 'border-green-500',
    iconBgLight: 'bg-green-100',
    iconBgDark: 'dark:bg-green-500/20',
    iconColor: 'text-green-600 dark:text-green-400',
    titleColor: 'text-green-800 dark:text-green-200',
    textColor: 'text-green-700 dark:text-green-300',
    buttonBg: 'bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500',
    defaultTitle: 'Success!'
  },
  error: {
    icon: AlertCircle,
    bgLight: 'bg-red-50',
    bgDark: 'dark:bg-red-950/50',
    borderColor: 'border-red-500',
    iconBgLight: 'bg-red-100',
    iconBgDark: 'dark:bg-red-500/20',
    iconColor: 'text-red-600 dark:text-red-400',
    titleColor: 'text-red-800 dark:text-red-200',
    textColor: 'text-red-700 dark:text-red-300',
    buttonBg: 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500',
    defaultTitle: 'Error'
  },
  info: {
    icon: Info,
    bgLight: 'bg-indigo-50',
    bgDark: 'dark:bg-indigo-950/50',
    borderColor: 'border-indigo-500',
    iconBgLight: 'bg-indigo-100',
    iconBgDark: 'dark:bg-indigo-500/20',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    titleColor: 'text-indigo-800 dark:text-indigo-200',
    textColor: 'text-indigo-700 dark:text-indigo-300',
    buttonBg: 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500',
    defaultTitle: 'Information'
  },
  warning: {
    icon: AlertTriangle,
    bgLight: 'bg-yellow-50',
    bgDark: 'dark:bg-yellow-950/50',
    borderColor: 'border-yellow-500',
    iconBgLight: 'bg-yellow-100',
    iconBgDark: 'dark:bg-yellow-500/20',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    titleColor: 'text-yellow-800 dark:text-yellow-200',
    textColor: 'text-yellow-700 dark:text-yellow-300',
    buttonBg: 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-600 dark:hover:bg-yellow-500',
    defaultTitle: 'Warning'
  }
}

function ConfirmationPopup({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const config = toastConfig[toast.type]
  const Icon = config.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 animate-fade-in backdrop-blur-sm">
      <div
        className={cn(
          'relative w-full max-w-md rounded-xl shadow-2xl border-l-4 animate-scale-in',
          config.bgLight,
          config.bgDark,
          config.borderColor
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={() => onDismiss(toast.id)}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-6">
          {/* Icon and Title */}
          <div className="flex items-center gap-4 mb-4">
            <div className={cn('p-3 rounded-full', config.iconBgLight, config.iconBgDark)}>
              <Icon className={config.iconColor} size={28} />
            </div>
            <h3 className={cn('text-xl font-bold', config.titleColor)}>
              {toast.title || config.defaultTitle}
            </h3>
          </div>

          {/* Message */}
          <p className={cn('text-base mb-4', config.textColor)}>
            {toast.message}
          </p>

          {/* Details list if provided */}
          {toast.details && toast.details.length > 0 && (
            <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-4 mb-4 space-y-2">
              {toast.details.map((detail, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">{detail.label}:</span>
                  <span className="text-foreground font-semibold">{detail.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Dismiss Button */}
          <button
            onClick={() => onDismiss(toast.id)}
            className={cn(
              'w-full py-3 px-4 rounded-lg text-white font-semibold transition-colors',
              config.buttonBg
            )}
          >
            OK, Got it
          </button>
        </div>
      </div>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const showToast = useCallback((type: ToastType, message: string, options?: ToastDetails) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = {
      id,
      type,
      message,
      title: options?.title,
      details: options?.details
    }
    setToasts(prev => [...prev, newToast])
  }, [])

  const success = useCallback((message: string, options?: ToastDetails) => {
    showToast('success', message, options)
  }, [showToast])

  const error = useCallback((message: string, options?: ToastDetails) => {
    showToast('error', message, options)
  }, [showToast])

  const info = useCallback((message: string, options?: ToastDetails) => {
    showToast('info', message, options)
  }, [showToast])

  const warning = useCallback((message: string, options?: ToastDetails) => {
    showToast('warning', message, options)
  }, [showToast])

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      {/* Popup Container - shows one at a time */}
      {toasts.length > 0 && (
        <ConfirmationPopup
          toast={toasts[0]}
          onDismiss={dismissToast}
        />
      )}
    </ToastContext.Provider>
  )
}
