import type React from 'react'
import type { Metadata } from 'next'
import { HOME_URL } from '../_lib/site'

export const metadata: Metadata = {
  title: { absolute: "Contact Brynz" },
  description: "Talk to Brynz about hiring engineers, enterprise delivery or your next role.",
  alternates: { canonical: `${HOME_URL}/contact` },
}

export default function ContactPage() {
  return (
    <main>
      <section className="wrap hero">
        <span className="trust rise"><span className="dot-live"></span>We reply within one business day</span>
        <h1 className="d1 fit rise r1">Let's <em>talk</em>.</h1>
        <p className="lede rise r2">Hiring, partnering or looking for your next role. Leave a note or grab 15 minutes.</p>
        <div className="hero-ctas rise r3"><a className="btn btn-primary" href="https://cal.com/brynztech" target="_blank" rel="noopener">Book a 15-minute call</a><a className="btn btn-ghost" href="#write">Leave a note</a></div>

      </section><section className="section wrap pt0" id="write" style={{ scrollMarginTop: '90px' }}>
        <div className="note">
          <div className="copy">
            <h2 className="d2">Leave us a <em>note</em>.</h2>
            <p className="lede">Tell us who you are and what you need. We'll take it from there.</p>
            <p className="sig-line">Every note is read by a Brynz partner, not a bot.</p>
          </div>
          <form className="note-form" data-form data-title="Website enquiry" noValidate>
            <div className="field"><label htmlFor="write-email">Work email</label><input id="write-email" name="write-email" type="email" data-label="Work email" placeholder="you@company.com" required autoComplete="email" /><span className="err">Enter a valid email address.</span></div>
            <div className="field"><label htmlFor="write-msg">How can we help?</label><textarea id="write-msg" name="write-msg" data-label="How can we help?" placeholder="We're a Series A startup hiring two backend engineers." required></textarea><span className="err">Tell us a little about what you need.</span></div>
            <div className="foot"><span className="fine">We reach out within one business day.</span><button className="btn btn-primary" type="submit">Send note</button></div>
          </form>
        </div>
      </section>
      <section className="section wrap pt0" id="about" style={{ scrollMarginTop: '90px' }}>
        <div className="story">
          <div>
            <h2 className="d2" style={{ color: 'var(--on-navy)' } as React.CSSProperties}>About Brynz</h2>
            <p style={{ marginTop: '20px', fontSize: '1.08rem', maxWidth: '34em', opacity: '.9' }}>Brynz is a technical recruiting firm. We place founding engineers and early operators at YC-backed and VC-funded startups worldwide, and we staff SAP, ERP, data, cloud and AI roles for enterprise delivery teams.</p>
            <p style={{ marginTop: '14px', fontSize: '1.08rem', maxWidth: '34em', opacity: '.9' }}>Our roots are in ERP, so we speak delivery language with enterprises and startup language with founders. Same bar on both sides.</p>
          </div>
          <div className="about-list"><span>Startups: founding and early teams</span><span>Enterprises: permanent, C2H and SOW</span><span>Frontier AI: researchers and domain experts</span><span>Talent: jobs straight from company career pages</span></div>
        </div>
      </section>
    </main>
  )
}
