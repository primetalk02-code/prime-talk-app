import { cn } from '../../lib/cn'

const variantClasses = {
  default: 'bg-slate-900 text-white',
  secondary: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  destructive: 'bg-rose-100 text-rose-700',
  info: 'bg-sky-100 text-sky-700',
}

function Badge({ className, variant = 'default', ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide',
        variantClasses[variant] || variantClasses.default,
        className,
      )}
      {...props}
    />
  )
}

export { Badge }
