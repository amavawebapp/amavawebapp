const PATHS: Record<string, string> = {
  home: 'M3 11l9-7 9 7M5 10v9a1 1 0 001 1h12a1 1 0 001-1v-9',
  people: 'M16 19v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 10a3 3 0 100-6 3 3 0 000 6zM17 11a3 3 0 10-1-5.8M21 19v-1a4 4 0 00-3-3.8',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  report: 'M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1zM14 3v5h5M9 13h7M9 17h5',
  gear: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 00-2-1.2L14 2h-4l-.5 2.6a7 7 0 00-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1c.6.5 1.3.9 2 1.2L10 22h4l.5-2.6c.7-.3 1.4-.7 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z',
  chevron: 'M9 6l6 6-6 6', back: 'M15 6l-6 6 6 6', check: 'M20 6L9 17l-5-5',
  plus: 'M12 5v14M5 12h14',
  sun: 'M12 3v2M12 19v2M5 5l1.5 1.5M17.5 17.5L19 19M3 12h2M19 12h2M5 19l1.5-1.5M17.5 6.5L19 5M12 8a4 4 0 100 8 4 4 0 000-8z',
  heart: 'M12 20s-7-4.5-9.5-9A4.5 4.5 0 0112 5a4.5 4.5 0 019.5 6c-2.5 4.5-9.5 9-9.5 9z',
  spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
  leaf: 'M5 19c0-8 6-13 14-13 0 8-5 14-13 14M5 19c2-3 4-5 7-6.5',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',
  download: 'M12 3v12M7 11l5 5 5-5M5 21h14',
  print: 'M6 9V3h12v6M6 18H4a1 1 0 01-1-1v-5a1 1 0 011-1h16a1 1 0 011 1v5a1 1 0 01-1 1h-2M6 14h12v7H6z',
  arrowup: 'M12 19V5M6 11l6-6 6 6', arrowright: 'M5 12h14M13 6l6 6-6 6',
  flag: 'M5 21V4M5 4s1.5-1 4-1 4 2 7 2 3-1 3-1v9s-1 1-3 1-4.5-2-7-2-4 1-4 1',
  pencil: 'M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z',
  wifi: 'M5 12.5a10 10 0 0114 0M8.5 16a5 5 0 017 0M12 19.5h.01',
  logout: 'M9 21H5a1 1 0 01-1-1V4a1 1 0 011-1h4M16 17l5-5-5-5M21 12H9',
  info: 'M12 16v-4M12 8h.01M12 21a9 9 0 100-18 9 9 0 000 18z',
}

export type IconName = keyof typeof PATHS

export function Icon({
  name, size = 24, stroke = 2, color = 'currentColor', fill = 'none', style, className,
}: {
  name: IconName; size?: number; stroke?: number; color?: string; fill?: string
  style?: React.CSSProperties; className?: string
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      style={style} className={className} aria-hidden="true">
      <path d={PATHS[name as string] || ''} />
    </svg>
  )
}
