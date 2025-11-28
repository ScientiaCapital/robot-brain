"use client"

import Link from "next/link"

export function CTASection() {
  return (
    <section className="py-24 px-6 bg-white relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-1/4 text-6xl opacity-10 animate-float">
          💭
        </div>
        <div className="absolute bottom-10 right-1/4 text-5xl opacity-10 animate-float-slow">
          💬
        </div>
        <div className="absolute top-1/2 left-10 text-4xl opacity-10 animate-float" style={{ animationDelay: '0.5s' }}>
          ✨
        </div>
        <div className="absolute top-1/3 right-10 text-4xl opacity-10 animate-float-slow" style={{ animationDelay: '1s' }}>
          🌟
        </div>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        {/* Animated robot */}
        <div className="mb-8">
          <span className="text-7xl md:text-8xl animate-bounce-fun inline-block">
            🤖
          </span>
        </div>

        {/* Headline */}
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 mb-6">
          Ready to Meet Your New Friend?
        </h2>

        {/* Subtext */}
        <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-xl mx-auto">
          Start chatting with Robot Friend today. It&apos;s free, fun, and safe!
        </p>

        {/* CTA Button */}
        <Link
          href="/chat"
          className="cta-button inline-flex items-center gap-3 text-xl animate-glow-pulse"
        >
          <span>Say Hello</span>
          <span className="animate-wave">👋</span>
        </Link>

        {/* Feature badges */}
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <div className="bg-slate-100 rounded-full px-4 py-2 flex items-center gap-2">
            <span>🎙️</span>
            <span className="text-sm text-slate-700">Voice Chat</span>
          </div>
          <div className="bg-slate-100 rounded-full px-4 py-2 flex items-center gap-2">
            <span>💬</span>
            <span className="text-sm text-slate-700">Text Chat</span>
          </div>
          <div className="bg-slate-100 rounded-full px-4 py-2 flex items-center gap-2">
            <span>🆓</span>
            <span className="text-sm text-slate-700">Free to Use</span>
          </div>
        </div>
      </div>
    </section>
  )
}
