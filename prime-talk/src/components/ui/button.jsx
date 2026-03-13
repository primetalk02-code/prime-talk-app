import { forwardRef } from 'react'
import { cn } from '../../lib/cn'

const variantClasses = {
  default: 'bg-sky-600 text-white hover:bg-sky-700',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
  outline: 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50',
  ghost: 'text-slate-700 hover:bg-slate-100',
  destructive: 'bg-rose-600 text-white hover:bg-rose-700',
}

const sizeClasses = {
  sm: 'h-9 rounded-lg px-3 text-sm',
  default: 'h-10 rounded-xl px-4 text-sm',
  lg: 'h-11 rounded-xl px-6 text-base',
  icon: 'h-10 w-10 rounded-xl',
}

const Button = forwardRef(function Button(
  { className, variant = 'default', size = 'default', type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition disabled:pointer-events-none disabled:opacity-55',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2',
        variantClasses[variant] || variantClasses.default,
        sizeClasses[size] || sizeClasses.default,
        className,
      )}
      {...props}
    />
  )
})

export { Button }
