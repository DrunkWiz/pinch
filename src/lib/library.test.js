import { beforeEach, describe, expect, it } from 'vitest'
import { clearRecipes, deleteRecipe, loadRecipes, saveRecipe } from './library.js'

const card = (title) => ({ title, ingredients: [], method: [], marginNotes: [], stillUnknown: [] })

function fakeStorage() {
  const data = new Map()
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
  }
}

describe('recipe library', () => {
  beforeEach(() => {
    globalThis.localStorage = fakeStorage()
  })

  it('starts empty', () => {
    expect(loadRecipes()).toEqual([])
  })

  it('saves cards newest first and reloads them', () => {
    saveRecipe(card('Betty Cooper’s Pancakes'))
    saveRecipe(card('Betty Cooper’s Waffles'))
    expect(loadRecipes().map((r) => r.card.title)).toEqual(['Betty Cooper’s Waffles', 'Betty Cooper’s Pancakes'])
  })

  it('deletes one card by id', () => {
    const a = saveRecipe(card('A'))
    saveRecipe(card('B'))
    deleteRecipe(a.id)
    expect(loadRecipes().map((r) => r.card.title)).toEqual(['B'])
  })

  it('clears every card', () => {
    saveRecipe(card('A'))
    saveRecipe(card('B'))
    clearRecipes()
    expect(loadRecipes()).toEqual([])
  })

  it('survives corrupt storage', () => {
    globalThis.localStorage.setItem('pinch.recipes.v1', '{not json')
    expect(loadRecipes()).toEqual([])
  })

  it('returns null instead of throwing when storage is blocked', () => {
    globalThis.localStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceeded')
      },
    }
    expect(saveRecipe(card('A'))).toBeNull()
  })
})
