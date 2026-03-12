'use client'

import { useState, useCallback, createContext, useContext, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastVariant = 'default' | 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within Toaster')
  return ctx
}

/**
 * Drop this once anywhere in the tree. It owns the toast state
 * and renders the overlay.
 */
export function Toaster({ children }: { children?: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((message: string, variant: ToastVariant = 'default') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev.slice(-4), { id, message, variant }])
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 4000)
    return () => clearTimeout(timer)
  }, [toast.id, onRemove])

  const icons: Record<ToastVariant, React.ReactNode> = {
    default: <Info size={16} className="text-[var(--text-secondary)]" />,
    success: <CheckCircle size={16} className="text-[var(--success)]" />,
    error:   <AlertCircle size={16} className="text-[var(--accent-primary)]" />,
    info:    <Info size={16} className="text-[#4A9EFF]" />,
  }

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-3 min-w-[280px] max-w-sm',
        'p-4 rounded-lg border bg-[var(--bg-card)] shadow-xl',
        'animate-[score-reveal_0.3s_ease_forwards]',
        toast.variant === 'success' && 'border-[var(--success)]',
        toast.variant === 'error'   && 'border-[var(--accent-primary)]',
        toast.variant === 'default' && 'border-[var(--border)]',
        toast.variant === 'info'    && 'border-[#4A9EFF]',
      )}
    >
      <span className="mt-0.5 shrink-0">{icons[toast.variant]}</span>
      <p className="flex-1 text-sm text-[var(--text-primary)]">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  )
}
