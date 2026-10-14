import Link from 'next/link'
import { BrynzLogo } from './brynz-logo'
import { BOOKING_URL } from '../_lib/site'

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div className="about">
            <BrynzLogo />
            <p>Technical recruiting for founding teams, enterprise delivery and frontier AI labs.</p>
          </div>
          <div>
            <h5>Talent</h5>
            <ul>
              <li><Link href="/jobs">Search jobs</Link></li>
              <li><Link href="/iit-talent">IIT Talent</Link></li>
              <li><Link href="/dashboard">Dashboard</Link></li>
              <li><Link href="/signup">Create profile</Link></li>
            </ul>
          </div>
          <div>
            <h5>Startups</h5>
            <ul>
              <li><Link href="/startups#process">Hiring process</Link></li>
              <li><Link href="/startups#hire">What we hire</Link></li>
              <li><Link href="/startups#brief">Get 5 vetted profiles</Link></li>
            </ul>
          </div>
          <div>
            <h5>Enterprises</h5>
            <ul>
              <li><Link href="/enterprises#models">Engagement models</Link></li>
              <li><Link href="/enterprises#practice">Practice areas</Link></li>
              <li><Link href="/enterprises#industries">Industries</Link></li>
            </ul>
          </div>
          <div>
            <h5>Company</h5>
            <ul>
              <li><Link href="/contact#about">About</Link></li>
              <li><Link href="/frontier-ai">Frontier AI</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><a href={BOOKING_URL} target="_blank" rel="noopener">Book a call</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} Brynz. All rights reserved.</span>
          <span>Privacy &nbsp; Terms</span>
        </div>
      </div>
    </footer>
  )
}
