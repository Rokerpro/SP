export function VoltIcon({
  className = '',
  width = 24,
  height = 24,
}: {
  className?: string
  width?: number
  height?: number
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 50"
      fill="none"
      stroke="currentColor"
      strokeWidth="4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      {/* Left terminal circle */}
      <circle cx="10" cy="25" r="4.5" fill="currentColor" stroke="currentColor" />
      {/* Left horizontal wire */}
      <line x1="14.5" y1="25" x2="25" y2="25" />
      {/* Resistor / Volt Zigzag Waveform */}
      <polyline points="25,25 31,10 39,40 47,10 55,40 63,10 71,40 77,25" />
      {/* Right horizontal wire */}
      <line x1="77" y1="25" x2="85.5" y2="25" />
      {/* Right terminal circle */}
      <circle cx="90" cy="25" r="4.5" fill="currentColor" stroke="currentColor" />
    </svg>
  )
}
