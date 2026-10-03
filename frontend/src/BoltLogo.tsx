type BoltLogoProps = {
  compact?: boolean
}

export function BoltLogo({ compact = false }: BoltLogoProps) {
  return (
    <span className={`bolt-logo${compact ? ' compact' : ''}`} aria-label="Bolt">
      <img src="/bolt-logo.svg" alt="" />
      {!compact && <span>BOLT</span>}
    </span>
  )
}
