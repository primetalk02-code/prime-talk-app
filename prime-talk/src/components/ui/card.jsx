import { cn } from '../../lib/cn'

function Card({ className, ...props }) {
  return (
    <div
      className={cn('rounded-2xl border border-slate-200 bg-white shadow-card', className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }) {
  return <div className={cn('space-y-1.5 p-6', className)} {...props} />
}

function CardTitle({ className, ...props }) {
  return <h3 className={cn('text-lg font-bold tracking-tight text-slate-900', className)} {...props} />
}

function CardDescription({ className, ...props }) {
  return <p className={cn('text-sm text-slate-500', className)} {...props} />
}

function CardContent({ className, ...props }) {
  return <div className={cn('p-6 pt-0', className)} {...props} />
}

function CardFooter({ className, ...props }) {
  return <div className={cn('flex items-center p-6 pt-0', className)} {...props} />
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle }
