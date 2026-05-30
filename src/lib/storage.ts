/** Accès typé et tolérant aux erreurs à localStorage. */

const PREFIX = 'futureminds:'

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function saveJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // quota dépassé ou stockage indisponible — on ignore silencieusement
  }
}

export function loadString(key: string, fallback = ''): string {
  try {
    return localStorage.getItem(PREFIX + key) ?? fallback
  } catch {
    return fallback
  }
}

export function saveString(key: string, value: string): void {
  try {
    localStorage.setItem(PREFIX + key, value)
  } catch {
    // ignore
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    // ignore
  }
}
