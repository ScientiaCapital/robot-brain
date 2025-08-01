import '@testing-library/jest-dom'
import 'whatwg-fetch'

// Mock localStorage
class LocalStorageMock {
  constructor() {
    this.store = {}
  }

  getItem = jest.fn((key) => {
    return this.store[key] || null
  })

  setItem = jest.fn((key, value) => {
    this.store[key] = value.toString()
  })

  removeItem = jest.fn((key) => {
    delete this.store[key]
  })

  clear = jest.fn(() => {
    this.store = {}
  })

  key = jest.fn((index) => {
    const keys = Object.keys(this.store)
    return keys[index] || null
  })

  get length() {
    return Object.keys(this.store).length
  }
}

global.localStorage = new LocalStorageMock()