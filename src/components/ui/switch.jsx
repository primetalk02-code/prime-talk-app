import { cn } from '../../lib/cn'

function Switch({ checked, onCheckedChange, disabled, className }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => {
        if (!disabled) {
          onCheckedChange?.(!checked)
        }
      }}
      className={cn(
        'relative inline-flex h-7 w-12 items-center rounded-full border transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2',
        checked ? 'border-emerald-400 bg-emerald-500' : 'border-slate-300 bg-slate-200',
        disabled && 'cursor-not-allowed opacity-60',
        className,
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  )
}

export { Switch }
