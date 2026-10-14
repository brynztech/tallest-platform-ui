import type React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: { absolute: "IIT Talent by Brynz" },
  description: "From an IIT or another premium institute, or doing top 1% work you can prove? Brynz puts you in front of startup founders directly.",
  alternates: { canonical: '/iit-talent' },
}

export default function IitTalentPage() {
  return (
    <main>
      <section className="wrap hero">
        <span className="trust rise">Invite-only. Reviewed by a human.</span>
        <h1 className="d1 rise r1">You didn’t slog for years<br />to compete with tier 3 <em>talent</em>.</h1>
        <p className="lede rise r2">From an IIT or another premium institute, or doing top 1% work you can prove? We put you in front of startup founders directly.</p>
        <div className="hero-ctas rise r3"><a className="btn btn-primary" href="#apply">Apply to join</a><a className="btn btn-ghost" href="#how">How it works</a></div>

      </section>
      <section className="section wrap pt0">
        <div className="section-head center"><h2 className="d2">Job boards treat every resume the <em>same</em>.</h2></div>
        <div className="vpair">
        <div className="vcard"><div className="vis b" data-live>
          <div className="pile mini">
            <div className="pile-head"><b>Applicants</b><span className="tnum"><span data-count="1240" data-repeat>1,240</span> in queue</span></div>
            <div className="prow-a"><span>Weekend bootcamp</span><b>#1</b></div>
            <div className="prow-a"><span>Keyword-matched CV</span><b>#2</b></div>
            <div className="prow-a"><span>Mass apply bot</span><b>#3</b></div>
            <div className="prow-a you"><span>You, IIT, shipped a ledger at scale</span><b>#212</b></div>
          </div>
        </div><div className="txt"><h3 className="d3">Your signal gets buried.</h3><p>An IIT degree and a weekend bootcamp land in the same applicant pile. The founder never sees the difference.</p></div></div>
        <div className="vcard"><div className="vis a" data-live>
          <div className="kw" data-kw><span data-keep="1">Java</span><span>ICPC finalist</span><span data-keep="1">Spring</span><span>Open-source maintainer</span><span data-keep="1">5+ years</span><span>Shipped 0 to 1</span></div>
        </div><div className="txt"><h3 className="d3">Recruiters screen for keywords.</h3><p>Your proof of work doesn't fit a filter. So it gets skipped by someone who can't read it.</p></div></div>
      </div>
      </section>

      <section className="section wrap pt0">
        <div className="section-head center"><h2 className="d2">Skip the pile. Start at the <em>founder</em>.</h2></div>
        <div className="bento four"><div><div className="glyph">CTO</div><h3 className="h4">Direct intros</h3><p>We introduce you to the founder or CTO, not an HR inbox.</p></div><div><div className="glyph">Warm</div><h3 className="h4">Pre-sold, not cold</h3><p>Founders hear your story from us before your first call. You walk in as a recommendation.</p></div><div><div className="glyph">0 to 1</div><h3 className="h4">Roles that match your bar</h3><p>Founding and early-team seats at YC and VC funded startups. Real ownership, real equity.</p></div><div><div className="glyph">Private</div><h3 className="h4">Off the market</h3><p>You stay invisible to everyone except the founders you say yes to.</p></div></div>
      </section>

      <section className="section wrap pt0">
        <div className="section-head center"><h2 className="d2">Two ways <em>in</em>.</h2></div>
        <div data-live><div className="paths">
        <div className="path"><span className="stepn">Path 1</span><h3 className="d2" style={{ fontSize: 'clamp(1.6rem,2.8vw,2.2rem)' }}>IITs and premium <em>institutes</em>.</h3><p>Your pedigree opens the door. Your work keeps it open.</p>
          <div className="chips"><span className="chip on a-pop" style={{ '--i': '0' } as React.CSSProperties}>IITs</span><span className="chip on a-pop" style={{ '--i': '1' } as React.CSSProperties}>NITs</span><span className="chip on a-pop" style={{ '--i': '2' } as React.CSSProperties}>BITS</span><span className="chip on a-pop" style={{ '--i': '3' } as React.CSSProperties}>IIITs</span><span className="chip on a-pop" style={{ '--i': '4' } as React.CSSProperties}>IISc</span><span className="chip on a-pop" style={{ '--i': '5' } as React.CSSProperties}>ISI</span><span className="chip on a-pop" style={{ '--i': '6' } as React.CSSProperties}>Top global universities</span></div></div>
        <div className="path"><span className="stepn">Path 2</span><h3 className="d2" style={{ fontSize: 'clamp(1.6rem,2.8vw,2.2rem)' }}>Top 1% proof of <em>work</em>.</h3><p>No pedigree needed if you can show it.</p>
          <div><div className="ck a-in" style={{ '--i': '1' } as React.CSSProperties}><span className="tk"></span><span>Shipped a product with real users or revenue</span></div><div className="ck a-in" style={{ '--i': '2' } as React.CSSProperties}><span className="tk"></span><span>Core contributor to a serious open-source project</span></div><div className="ck a-in" style={{ '--i': '3' } as React.CSSProperties}><span className="tk"></span><span>Strong ranks in ICPC, Codeforces or Kaggle</span></div><div className="ck a-in" style={{ '--i': '4' } as React.CSSProperties}><span className="tk"></span><span>Published research at a recognised venue</span></div><div className="ck a-in" style={{ '--i': '5' } as React.CSSProperties}><span className="tk"></span><span>Founding engineer at a startup that raised</span></div></div></div>
      </div>
      <p className="sig-line" style={{ textAlign: 'center', marginTop: '22px' }}>Either way, we check the proof. That's what makes the intro worth something.</p></div>
      </section>

      <section className="section wrap pt0" id="how" style={{ scrollMarginTop: '90px' }}>
        <div className="section-head center"><h2 className="d2">How it <em>works</em>.</h2></div>
        <div className="track" data-track><span className="beam"></span><div className="tstep"><div className="when"><span>Step 01</span><span className="st"></span></div><b>Apply in 5 minutes</b><span className="d">Your profile, your college or your proof</span></div><div className="tstep"><div className="when"><span>Step 02</span><span className="st"></span></div><b>Reviewed by a human</b><span className="d">A Brynz partner reads every application</span></div><div className="tstep"><div className="when"><span>Step 03</span><span className="st"></span></div><b>Meet the right founders</b><span className="d">Warm intros to startups that fit your stack and stage</span></div><div className="tstep"><div className="when"><span>Step 04</span><span className="st"></span></div><b>Choose your seat</b><span className="d">We handle scheduling, offers and negotiation</span></div></div>
      </section>

      <section className="section wrap pt0"><div className="story">
        <div><blockquote>Founders don't want more resumes. <span>They want you.</span></blockquote><p className="by">Every founder we work with is hiring their first ten engineers. They need people who own outcomes from day one. That's the only kind of engineer we introduce.</p></div>
        <div className="thread" data-thread aria-label="Example founder introduction">
          <div className="msg out" style={{ '--i': '0' } as React.CSSProperties}><span className="meta">Brynz, to a founder</span>Meet R. IIT Madras. Built the payments ledger at a Series B and kept it consistent through 10x growth. You'll like how she thinks.</div>
          <div className="msg in" style={{ '--i': '1' } as React.CSSProperties}><span className="meta">Founder</span>Intro me today. I'll clear my afternoon.</div>
          <div className="msg sys" style={{ '--i': '2' } as React.CSSProperties}>Founder call booked</div>
        </div>
      </div></section>

      <section className="section wrap pt0">
        <div className="section-head center"><h2 className="d2">Questions, <em>answered</em>.</h2></div>
        <div className="faq"><details open><summary>Is this free for engineers?</summary><p>Yes. Always. Startups pay us, never you.</p></details><details><summary>I didn't go to an IIT. Can I still apply?</summary><p>Yes. Strong proof of work counts as much as pedigree. Show us what you built.</p></details><details><summary>Will my current employer find out?</summary><p>No. Your profile is never public. Founders see you only after you approve the intro.</p></details><details><summary>What kind of roles?</summary><p>Founding engineer, early backend, ML and AI engineering, full-stack and forward deployed. Remote, India and US.</p></details><details><summary>What if I'm not ready to move yet?</summary><p>Apply anyway. We'll keep you in the loop for the right role, not every role.</p></details></div>
      </section>

      <section className="section wrap pt0" id="apply" style={{ scrollMarginTop: '90px' }}>
        <div className="note">
          <div className="copy">
            <h2 className="d2">Show us your <em>best work</em>.</h2>
            <p className="lede">LinkedIn, GitHub and your resume are required. Links over paragraphs.</p>
            <p className="sig-line">Every application is read by a Brynz partner, not a bot.</p>
          </div>
          <form className="note-form" data-form data-title="IIT Talent application" noValidate>
            <div className="field"><label htmlFor="iit-email">Email</label><input id="iit-email" name="iit-email" type="email" data-label="Email" placeholder="you@example.com" required autoComplete="email" /><span className="err">Enter a valid email address.</span></div>
            <div className="row2"><div className="field"><label htmlFor="iit-linkedin">LinkedIn</label><input id="iit-linkedin" name="iit-linkedin" type="url" data-label="LinkedIn" placeholder="linkedin.com/in/you" required /><span className="err">This field is required.</span></div><div className="field"><label htmlFor="iit-github">GitHub</label><input id="iit-github" name="iit-github" type="url" data-label="GitHub" placeholder="github.com/you" required /><span className="err">This field is required.</span></div></div>
            <div className="field"><label htmlFor="iit-resume">Resume</label><label className="file-drop" htmlFor="iit-resume"><input id="iit-resume" name="iit-resume" type="file" accept=".pdf,.doc,.docx" data-label="Resume" required /><span className="fd-t">Upload PDF or Word, up to 5 MB</span></label><span className="err">Attach your resume (PDF or Word, up to 5 MB).</span></div>
            <div className="field"><label htmlFor="iit-college">College, or a proof of work link</label><input id="iit-college" name="iit-college" type="text" data-label="College, or a proof of work link" placeholder="IIT Bombay, or a link to what you built" required /><span className="err">This field is required.</span></div>
            <div className="field"><label htmlFor="iit-msg">The hardest thing you've shipped, in one line</label><textarea id="iit-msg" name="iit-msg" data-label="The hardest thing you've shipped, in one line" placeholder="Rebuilt our matching engine to handle 50x traffic with zero downtime." required></textarea><span className="err">Tell us a little about what you need.</span></div>
            <div className="foot"><span className="fine">Free for engineers. Always.</span><button className="btn btn-primary" type="submit">Apply to join</button></div>
          </form>
        </div>
      </section>
      <section className="section-tight"><div className="wrap">
        <div className="cta-band">
          <h2 className="d2">The founders are ready. Are you?</h2>
          <div className="acts">
            <p>Founding and early-team seats at YC and VC funded startups.</p>
            <div className="btns"><a className="btn btn-light" href="#apply">Apply to join</a><Link className="btn btn-outline-light" href="/jobs">See open roles</Link></div>
          </div>
        </div>
      </div></section>
    </main>
  )
}
