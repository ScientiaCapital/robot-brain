"use client"

import Link from 'next/link'

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center bg-hero-gradient overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 text-6xl opacity-20 animate-float-slow">
          ✨
        </div>
        <div className="absolute top-40 right-20 text-4xl opacity-20 animate-float" style={{ animationDelay: '0.5s' }}>
          🌟
        </div>
        <div className="absolute bottom-40 left-20 text-5xl opacity-20 animate-float-slow" style={{ animationDelay: '1s' }}>
          💫
        </div>
        <div className="absolute bottom-20 right-10 text-4xl opacity-20 animate-float" style={{ animationDelay: '1.5s' }}>
          ⭐
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* Animated Robot Avatar */}
        <div className="mb-8">
          <span className="text-8xl md:text-9xl animate-float inline-block">
            😊
          </span>
          <span className="text-4xl md:text-5xl animate-wave ml-4 inline-block">
            👋
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-slate-800 mb-6 leading-tight">
          Meet{' '}
          <span className="text-playful-blue bg-clip-text">
            Robot Friend
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Your cheerful AI companion that listens, learns, and makes you smile.
          <span className="block mt-2 text-lg md:text-xl text-slate-500">
            Safe, fun, and always ready to help!
          </span>
        </p>

        {/* CTA Button */}
        <Link
          href="/chat"
          className="cta-button inline-flex items-center gap-3 animate-glow-pulse"
        >
          <span>Say Hello to Robot Friend</span>
          <span className="text-2xl animate-bounce-fun">🤖</span>
        </Link>

        {/* Trust indicators */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛡️</span>
            <span>Safe for Kids</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🔒</span>
            <span>Private & Secure</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🎙️</span>
            <span>Voice Enabled</span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-slate-300 rounded-full flex items-start justify-center p-2">
          <div className="w-1.5 h-2.5 bg-slate-400 rounded-full animate-pulse"></div>
        </div>
      </div>
    </section>
  )
}
