import { HeroSection } from './_components/hero-section'

export default function HomePage() {
  return (
    <main className="relative flex min-h-[calc(100vh-64px)] flex-col items-center justify-center overflow-hidden px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,oklch(0.94_0.035_45_/_0.7),transparent_38%)]" />
      <HeroSection />
    </main>
  )
}
