import { HeroSection } from './_components/hero-section'
import { FeaturedJobs } from './_components/featured-jobs'

export default function HomePage() {
  return (
    <main className="flex flex-col items-center px-4 pt-8 pb-16 sm:px-6 sm:pt-12 sm:pb-20">
      <HeroSection />
      <FeaturedJobs />
    </main>
  )
}
