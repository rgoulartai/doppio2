const KEY = 'doppio_bookmarks'

function getAll(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

export function isBookmarked(cardId: string): boolean {
  return getAll().includes(cardId)
}

/** Toggles bookmark. Returns the new bookmarked state. */
export function toggleBookmark(cardId: string): boolean {
  const current = getAll()
  const next = current.includes(cardId)
    ? current.filter(id => id !== cardId)
    : [...current, cardId]
  localStorage.setItem(KEY, JSON.stringify(next))
  return next.includes(cardId)
}

export function getBookmarkedIds(): string[] {
  return getAll()
}
