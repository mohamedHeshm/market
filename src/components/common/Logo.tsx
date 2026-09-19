export function Logo({ className }: { className?: string }) {
  return (
    <span className={className ? className : 'flex items-center gap-2'}>
      <svg width="30" height="30" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="64" height="64" rx="16" fill="#0F3D2E" />
        <path d="M16 40C16 33 21 24 32 24C43 24 48 33 48 40" stroke="#E2A33D" strokeWidth="4" strokeLinecap="round" />
        <circle cx="20" cy="44" r="4" fill="#FAF8F4" />
        <circle cx="44" cy="44" r="4" fill="#FAF8F4" />
      </svg>
      <span className="text-lg font-bold tracking-tight text-ink">وصلة</span>
    </span>
  )
}
