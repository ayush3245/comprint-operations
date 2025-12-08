'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react'

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
    bgColor: 'bg-green-50',
    borderColor: 'border-green-500',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    titleColor: 'text-green-800',
    textColor: 'text-green-700',
    buttonBg: 'bg-green-600 hover:bg-green-700',
    defaultTitle: 'Success!'
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-500',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    titleColor: 'text-red-800',
    textColor: 'text-red-700',
    buttonBg: 'bg-red-600 hover:bg-red-700',
    defaultTitle: 'Error'
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-500',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-800',
    textColor: 'text-blue-700',
    buttonBg: 'bg-blue-600 hover:bg-blue-700',
    defaultTitle: 'Information'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-500',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    titleColor: 'text-yellow-800',
    textColor: 'text-yellow-700',
    buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
    defaultTitle: 'Warning'
  }
}

function ConfirmationPopup({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const config = toastConfig[toast.type]
  const Icon = config.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div
        className={`relative w-full max-w-md rounded-xl shadow-2xl border-l-4 ${config.bgColor} ${config.borderColor} animate-scale-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={() => onDismiss(toast.id)}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-6">
          {/* Icon and Title */}
          <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 rounded-full ${config.iconBg}`}>
              <Icon className={config.iconColor} size={28} />
            </div>
            <h3 className={`text-xl font-bold ${config.titleColor}`}>
              {toast.title || config.defaultTitle}
            </h3>
          </div>

          {/* Message */}
          <p className={`text-base ${config.textColor} mb-4`}>
            {toast.message}
          </p>

          {/* Details list if provided */}
          {toast.details && toast.details.length > 0 && (
            <div className="bg-white/60 rounded-lg p-4 mb-4 space-y-2">
              {toast.details.map((detail, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600 font-medium">{detail.label}:</span>
                  <span className="text-gray-900 font-semibold">{detail.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Dismiss Button */}
          <button
            onClick={() => onDismiss(toast.id)}
            className={`w-full py-3 px-4 rounded-lg text-white font-semibold transition-colors ${config.buttonBg}`}
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
