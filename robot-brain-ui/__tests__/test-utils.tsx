import React from 'react'
import { render, RenderOptions } from '@testing-library/react'

// Centralized framer-motion mock
export const mockFramerMotion = () => {
  const mockComponent = (Component: string) => {
    // eslint-disable-next-line react/display-name
    return React.forwardRef(({ children, whileHover, whileTap, animate, initial, exit, transition, variants, custom, ...props }: any, ref: any) => {
      const elementProps = { ...props }
      if (ref) elementProps.ref = ref
      return React.createElement(Component, elementProps, children)
    })
  }

  return {
    motion: {
      div: mockComponent('div'),
      span: mockComponent('span'),
      button: mockComponent('button'),
      h1: mockComponent('h1'),
      h2: mockComponent('h2'),
      h3: mockComponent('h3'),
      p: mockComponent('p'),
      ul: mockComponent('ul'),
      li: mockComponent('li'),
      section: mockComponent('section'),
      article: mockComponent('article'),
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
    useAnimation: () => ({
      start: jest.fn(),
      stop: jest.fn(),
      set: jest.fn(),
    }),
    useMotionValue: (initial: any) => ({
      get: () => initial,
      set: jest.fn(),
      onChange: jest.fn(),
      destroy: jest.fn(),
    }),
  }
}

// Mock DOM APIs that jsdom doesn't support
export const setupDomMocks = () => {
  // Skip DOM mocks in Node environment
  if (typeof window === 'undefined') {
    return
  }

  // Mock scrollIntoView
  if (typeof Element !== 'undefined') {
    Element.prototype.scrollIntoView = jest.fn()
  }
  
  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor(callback: any) {}
    disconnect() {}
    observe() {}
    unobserve() {}
    takeRecords() { return [] }
    root = null
    rootMargin = ''
    thresholds = []
  } as any

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    constructor(callback: any) {}
    disconnect() {}
    observe() {}
    unobserve() {}
  } as any

  // Mock matchMedia
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    })
  }
}

// Helper to create mock NextRequest for API testing
export const createMockRequest = (url: string, init: RequestInit = {}) => {
  const request = {
    url,
    method: init.method || 'GET',
    headers: new Headers(init.headers),
    json: async () => init.body ? JSON.parse(init.body as string) : {},
    text: async () => init.body as string || '',
    clone: () => request,
    // Add other NextRequest properties as needed
  }
  return request as any // Cast to bypass TypeScript checking in tests
}

// Custom render function that includes common providers
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, { ...options })
}

export * from '@testing-library/react'
export { customRender as render }