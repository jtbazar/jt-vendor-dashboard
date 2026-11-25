export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

export function formatPKR(value: number) {
  return `PKR ${Math.round(value).toLocaleString('en-PK')}`
}

export function formatCompactPKR(value: number) {
  if (value >= 100000) return `PKR ${(value / 1000).toFixed(0)}k`
  if (value >= 1000) return `PKR ${(value / 1000).toFixed(1)}k`
  return `PKR ${value}`
}

export function formatNumber(value: number) {
  return value.toLocaleString('en-PK')
}

export function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function imageUrl(id: string, width = 900) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`
}
