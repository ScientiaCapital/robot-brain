"use client"

import Link from "next/link"

export function LandingFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-slate-900 text-slate-300 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Main footer content */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Brand */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
              <span className="text-3xl">😊</span>
              <span className="text-xl font-bold text-white">Robot Brain</span>
            </div>
            <p className="text-sm text-slate-400 max-w-xs">
              An AI companion designed to make learning fun and conversations magical.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-8 text-sm">
            <Link href="/chat" className="hover:text-white transition-colors">
              Start Chatting
            </Link>
            <Link href="#features" className="hover:text-white transition-colors">
              Features
            </Link>
            <Link href="#demo" className="hover:text-white transition-colors">
              Try Demo
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800 my-8" />

        {/* Bottom row */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>
            &copy; {currentYear} Robot Brain. Built with ❤️ for curious minds.
          </p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1">
              <span>🛡️</span>
              Kid-Safe
            </span>
            <span className="flex items-center gap-1">
              <span>🔒</span>
              Private
            </span>
            <span className="flex items-center gap-1">
              <span>⚡</span>
              Powered by AI
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
