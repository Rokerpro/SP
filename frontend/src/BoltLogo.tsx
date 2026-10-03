type BoltLogoProps = {
  compact?: boolean
}

export function BoltLogo({ compact = false }: BoltLogoProps) {
  return (
    <span className={`bolt-logo${compact ? ' compact' : ''}`} aria-label="Bolt">
      <img className="bolt-logo-image" src="/bolt-logo.svg" alt="" width="32" height="32" />
      {!compact && <span>BOLT</span>}
    </span>
  )
}
