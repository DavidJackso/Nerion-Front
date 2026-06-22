export function fmtDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('ru')
}

export function initials(name) {
  return String(name || '').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
}
