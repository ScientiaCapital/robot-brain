import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

// Optimized font loading with display swap for better performance
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false, // Only preload primary font
});

export const metadata: Metadata = {
  title: "Robot Brain - AI-Powered Chat Assistant",
  description: "Intelligent robot companion powered by Claude AI and ElevenLabs voice synthesis. Chat with Robot Friend in text or voice mode.",
  keywords: "AI, chatbot, robot, voice assistant, Claude, ElevenLabs",
  authors: [{ name: "Robot Brain Team" }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_API_URL || 'https://robot-brain-rb7xfb8h2-scientia-capital.vercel.app'),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Robot Brain",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Robot Brain - AI Chat Assistant",
    description: "Chat with Robot Friend, your intelligent AI companion",
    type: "website",
    locale: "en_US",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#8B5CF6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* PWA - Apple Touch Icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-96x96.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-72x72.png" />

        {/* Preconnect to external domains for faster loading */}
        <link rel="preconnect" href="https://api.elevenlabs.io" />
        <link rel="preconnect" href="https://api.anthropic.com" />
        
        {/* Performance monitoring script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                window.addEventListener('load', () => {
                  if ('requestIdleCallback' in window) {
                    requestIdleCallback(() => {
                      import('/src/lib/performance-monitor.js').then(module => {
                        module.performanceMonitor.logPerformanceReport();
                      });
                    });
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
