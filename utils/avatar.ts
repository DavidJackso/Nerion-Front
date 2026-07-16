function hashSeed(seed: string | number): number {
  const s = String(seed)
  let h = 0
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h
}

interface AvatarHue { solid: string; bg: string; fg: string }

const AVATAR_HUES: AvatarHue[] = [
  { solid: 'var(--purple-400)', bg: 'var(--brand-tint)',  fg: 'var(--purple-700)' },
  { solid: 'var(--green-500)',  bg: 'var(--green-50)',    fg: 'var(--green-700)'  },
  { solid: 'var(--amber-500)',  bg: 'var(--amber-50)',    fg: 'var(--amber-700)'  },
  { solid: 'var(--blue-500)',   bg: 'var(--blue-50)',     fg: 'var(--blue-600)'   },
  { solid: 'var(--purple-600)', bg: 'var(--purple-100)',  fg: 'var(--purple-700)' },
]

export function avatarHue(seed: string | number | null | undefined): AvatarHue {
  return AVATAR_HUES[hashSeed(seed ?? '') % AVATAR_HUES.length]
}
