interface MethodColor { bg: string; fg: string }

const METHOD_COLOR: Record<string, MethodColor> = {
  GET:    { bg: 'var(--blue-50)',  fg: 'var(--info-fg)'    },
  POST:   { bg: 'var(--green-50)', fg: 'var(--success-fg)' },
  PATCH:  { bg: 'var(--amber-50)', fg: 'var(--warning-fg)' },
  DELETE: { bg: 'var(--red-50)',   fg: 'var(--danger-fg)'  },
}

export function methodColor(method: string): MethodColor {
  return METHOD_COLOR[method] ?? { bg: 'var(--bg-2)', fg: 'var(--fg-2)' }
}
