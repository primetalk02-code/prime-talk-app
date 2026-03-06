function IconBase({ className = 'h-5 w-5', children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function DashboardIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </IconBase>
  )
}

export function CalendarIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </IconBase>
  )
}

export function ClockIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </IconBase>
  )
}

export function EarningsIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M12 3v18" />
      <path d="M16 7.5c0-1.9-1.8-3.5-4-3.5s-4 1.6-4 3.5s1.8 3.5 4 3.5s4 1.6 4 3.5s-1.8 3.5-4 3.5s-4-1.6-4-3.5" />
    </IconBase>
  )
}

export function StarIcon(props) {
  return (
    <IconBase {...props}>
      <path d="m12 3l2.9 5.9L21 9.8l-4.5 4.3L17.6 21L12 18l-5.6 3l1.1-6.9L3 9.8l6.1-.9z" />
    </IconBase>
  )
}

export function MessageIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
    </IconBase>
  )
}

export function UserIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </IconBase>
  )
}

export function BookIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3z" />
      <path d="M5 4v16a3 3 0 0 1 3-3h11" />
    </IconBase>
  )
}

export function SlidersIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M4 6h16" />
      <circle cx="9" cy="6" r="2" />
      <path d="M4 12h16" />
      <circle cx="14" cy="12" r="2" />
      <path d="M4 18h16" />
      <circle cx="7" cy="18" r="2" />
    </IconBase>
  )
}

export function LogoutIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17l5-5l-5-5" />
      <path d="M21 12H9" />
    </IconBase>
  )
}

export function MenuIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </IconBase>
  )
}

export function CloseIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M6 6l12 12M18 6l-12 12" />
    </IconBase>
  )
}

export function ChevronDownIcon(props) {
  return (
    <IconBase {...props}>
      <path d="m6 9l6 6l6-6" />
    </IconBase>
  )
}

export function TrendIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M3 17l6-6l4 4l7-7" />
      <path d="M14 8h6v6" />
    </IconBase>
  )
}
