// "Your recipes": finished cards saved in this browser (localStorage).
// No accounts, no server — cards live on this device only, so Print stays the real backup.
// Every read and write is wrapped: private windows and blocked storage just mean no library.

const KEY = 'pinch.recipes.v1'

function storage() {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

export function loadRecipes() {
  try {
    const raw = storage()?.getItem(KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list.filter((r) => r?.id && r?.card) : []
  } catch {
    return []
  }
}

function write(list) {
  try {
    const s = storage()
    if (!s) return false
    s.setItem(KEY, JSON.stringify(list))
    return true
  } catch {
    return false
  }
}

// Saves a card, newest first. Returns the saved entry, or null if storage isn't available.
export function saveRecipe(card) {
  const entry = { id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, savedAt: new Date().toISOString(), card }
  return write([entry, ...loadRecipes()]) ? entry : null
}

export function deleteRecipe(id) {
  return write(loadRecipes().filter((r) => r.id !== id))
}
