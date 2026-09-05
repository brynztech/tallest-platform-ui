'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Quantico } from 'next/font/google'
import styles from './page.module.css'

const quantico = Quantico({ subsets: ['latin'], weight: ['400', '700'] })

const HERO_VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260823_050407_500d0339-ab28-41c1-9688-132a74a3b5aa.mp4'
const ABOUT_VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260823_063501_2e2c8971-de1e-473a-8611-a0c9ae7ee186.mp4'

// Autoplay is unreliable across mobile browsers even with muted+playsinline —
// retry on an interval and on the first user gesture, swallow rejections.
function useAutoplayRetry(ref: React.RefObject<HTMLVideoElement | null>) {
  useEffect(() => {
    const attempt = () => {
      const video = ref.current
      if (!video) return
      video.muted = true
      video.play().catch(() => {})
    }
    attempt()
    const interval = setInterval(attempt, 1000)
    document.addEventListener('click', attempt)
    document.addEventListener('touchstart', attempt)
    return () => {
      clearInterval(interval)
      document.removeEventListener('click', attempt)
      document.removeEventListener('touchstart', attempt)
    }
  }, [ref])
}

export default function ConsolePage() {
  const heroVideoRef = useRef<HTMLVideoElement>(null)
  const aboutVideoRef = useRef<HTMLVideoElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  useAutoplayRetry(heroVideoRef)
  useAutoplayRetry(aboutVideoRef)

  return (
    <div className={`${styles.page} ${quantico.className}`}>
      <section className={styles.hero}>
        <video
          ref={heroVideoRef}
          className={styles.heroVideo}
          src={HERO_VIDEO_SRC}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
        <div className={styles.scrim} />

        <nav className={styles.navbar}>
          <div className={styles.logo}>
            <div className={styles.logoMark}>
              <span />
            </div>
            <span className={styles.brandName}>BrynzIT</span>
          </div>

          <div className={styles.navLinks}>
            <a href="#">Home</a>
            <a href="#about">About</a>
          </div>

          <button
            type="button"
            className={styles.hamburger}
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </nav>

        {menuOpen && (
          <div className={styles.mobileMenu}>
            <a href="#">Home</a>
            <a href="#about">About</a>
          </div>
        )}

        <h1 className={styles.headline}>
          <span>Manage</span>
          <span>every</span>
          <span>requisition</span>
          <span className={styles.indent}>from</span>
          <span className={styles.indent}>one</span>
          <span className={`${styles.indent} ${styles.accent}`}>console</span>
        </h1>

        <div className={styles.heroCta}>
          <Link href="/signin" className={styles.ctaButton}>
            Sign in
          </Link>
        </div>
      </section>

      <section className={styles.about} id="about">
        <div className={styles.aboutLeft}>
          <h2 className={styles.aboutHeading}>
            <span>About</span>
            <span className={`${styles.indent} ${styles.accent}`}>BrynzIT</span>
          </h2>
          <p className={styles.aboutParagraph}>
            BrynzIT is where your team runs hiring end to end — open a requisition, assign it to a
            recruiter, and track every candidate through the pipeline in one place. No
            spreadsheets, no lost handoffs, no guessing who owns what.
          </p>
          <Link href="/signin" className={styles.ctaButton}>
            Learn more
          </Link>
        </div>

        <div className={styles.aboutRight}>
          <video
            ref={aboutVideoRef}
            className={styles.aboutVideo}
            src={ABOUT_VIDEO_SRC}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
          <div className={styles.aboutOverlay} />
        </div>
      </section>
    </div>
  )
}
