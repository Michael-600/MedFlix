const STORAGE_PREFIX = 'medflix_'

export const storage = {
  get(key) {
    try {
      const item = localStorage.getItem(STORAGE_PREFIX + key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
    } catch (e) {
      console.warn('localStorage write failed:', e)
    }
  },

  remove(key) {
    localStorage.removeItem(STORAGE_PREFIX + key)
  },

  clear() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(STORAGE_PREFIX))
      .forEach(k => localStorage.removeItem(k))
  }
}
