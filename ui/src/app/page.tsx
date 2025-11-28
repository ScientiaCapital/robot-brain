import { HeroSection, FeaturesGrid, DemoWidget, CTASection, LandingFooter } from '@/components/landing'

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <section id="features">
        <FeaturesGrid />
      </section>

      {/* Demo Section */}
      <section id="demo">
        <DemoWidget />
      </section>

      {/* Final CTA */}
      <CTASection />

      {/* Footer */}
      <LandingFooter />
    </div>
  )
}