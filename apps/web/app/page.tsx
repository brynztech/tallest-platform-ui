import { HeroSection } from './_components/hero-section'
import { FeaturedJobs } from './_components/featured-jobs'

export default function HomePage() {
  return (
    <main className="flex flex-col items-center px-6 pt-12 pb-20">
      <HeroSection />
      <FeaturedJobs />
    </main>
  )
}
