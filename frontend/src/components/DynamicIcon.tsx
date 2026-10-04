import React from 'react'

const ICON_MAP: Record<string, string> = {
  // Keywords from backend seed
  prism: 'fa-solid fa-shapes',
  shield: 'fa-solid fa-shield-halved',
  wing: 'fa-solid fa-feather-pointed',
  orbit: 'fa-solid fa-atom',
  code: 'fa-solid fa-code',
  growth: 'fa-solid fa-arrow-trend-up',
  calendar: 'fa-solid fa-calendar-days',
  leaf: 'fa-solid fa-leaf',
  wave: 'fa-solid fa-water',
  helix: 'fa-solid fa-dna',
  network: 'fa-solid fa-network-wired',
  moon: 'fa-solid fa-moon',
  earth: 'fa-solid fa-earth-americas',
  planet: 'fa-solid fa-globe',
  lock: 'fa-solid fa-lock',
  triangle: 'fa-solid fa-play',
  column: 'fa-solid fa-monument',
  drop: 'fa-solid fa-droplet',
  chain: 'fa-solid fa-link',
  tree: 'fa-solid fa-tree',
  brain: 'fa-solid fa-brain',
  solar: 'fa-solid fa-sun',
  chart: 'fa-solid fa-chart-line',
  quill: 'fa-solid fa-feather',
  spark: 'fa-solid fa-bolt',
  rocket: 'fa-solid fa-rocket',
  telescope: 'fa-solid fa-satellite',
  atom: 'fa-solid fa-atom',
  gem: 'fa-solid fa-gem',

  // Emojis from UI and dummy decks
  '🌌': 'fa-solid fa-meteor',
  '🕳️': 'fa-solid fa-circle-notch',
  '🕳': 'fa-solid fa-circle-notch',
  '🔭': 'fa-solid fa-satellite',
  '⭐': 'fa-solid fa-star',
  '⚡': 'fa-solid fa-bolt',
  '⚛️': 'fa-solid fa-atom',
  '⚛': 'fa-solid fa-atom',
  '🤖': 'fa-solid fa-robot',
  '🔋': 'fa-solid fa-battery-full',
  '🧠': 'fa-solid fa-brain',
  '🎯': 'fa-solid fa-bullseye',
  '🏛️': 'fa-solid fa-landmark',
  '🏛': 'fa-solid fa-landmark',
  '📜': 'fa-solid fa-scroll',
  '🗿': 'fa-solid fa-monument',
  '🏆': 'fa-solid fa-trophy',
  '🎉': 'fa-solid fa-award',
  '🔥': 'fa-solid fa-fire',
  '🔄': 'fa-solid fa-rotate-right',
  '🚀': 'fa-solid fa-rocket',
  '💡': 'fa-solid fa-lightbulb',
  '🔖': 'fa-solid fa-bookmark',
  '🏷️': 'fa-regular fa-bookmark',
  '🏷': 'fa-regular fa-bookmark',
  '🔍': 'fa-solid fa-magnifying-glass',
  '✉': 'fa-solid fa-envelope',
  '🔑': 'fa-solid fa-key',
  '👁': 'fa-solid fa-eye',
  '🙈': 'fa-solid fa-eye-slash',
  '✎': 'fa-solid fa-pen',
  '⏳': 'fa-solid fa-hourglass-half',
  '❌': 'fa-solid fa-xmark',
  '✕': 'fa-solid fa-xmark',
  '✓': 'fa-solid fa-check',
  '🥇': 'fa-solid fa-medal',
  '🥈': 'fa-solid fa-medal',
  '🥉': 'fa-solid fa-medal',
  '🎴': 'fa-solid fa-layer-group',
  '👥': 'fa-solid fa-user-group',
  '🛡️': 'fa-solid fa-shield-halved',
  '🛡': 'fa-solid fa-shield-halved',
  '🚪': 'fa-solid fa-arrow-right-from-bracket',
  '📚': 'fa-solid fa-book-open',
}

export function DynamicIcon({
  name,
  className = '',
  style,
}: {
  name?: string
  className?: string
  style?: React.CSSProperties
}) {
  if (!name) return null

  // If already a FontAwesome class string
  if (name.includes('fa-')) {
    return <i className={`${name} ${className}`} style={style} aria-hidden="true" />
  }

  const key = name.trim().toLowerCase()
  const mapped = ICON_MAP[name.trim()] || ICON_MAP[key]

  if (mapped) {
    return <i className={`${mapped} ${className}`} style={style} aria-hidden="true" />
  }

  return <span className={className} style={style}>{name}</span>
}
