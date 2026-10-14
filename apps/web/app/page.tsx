import type React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: { absolute: "Brynz" },
  description: "Brynz connects exceptional engineers with high-growth startups, enterprise delivery teams and frontier AI labs.",
  alternates: { canonical: '/' },
}

export default function HomePage() {
  return (
    <main>
      <section className="wrap hero">
        <Link className="trust rise" href="/startups">Trusted by 10+ <span className="yc" aria-hidden="true">Y</span><b>YC &amp; VC funded startups</b></Link>
        <h1 className="d1 fit rise r1">Talent that <em>ships</em>.</h1>
        <p className="lede rise r2">Engineers for Founding Teams, Enterprise Delivery and Frontier AI Labs.</p>
        <div className="hero-ctas rise r3"><Link className="btn btn-primary" href="/startups">Hire talent</Link><Link className="btn btn-ghost" href="/jobs">Find a role</Link></div>

      </section>
      <section className="wrap" style={{ paddingBottom: 'clamp(56px,8vw,96px)' }}>
        <div className="doors"><Link className="aud door" href="/jobs"><div className="head"><h3>Talent</h3><div className="sub">Your AI job search engine</div></div><div className="vis a" data-typer><div className="mini mini-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg><span className="typer-text"></span><span className="caret"></span></div><div className="mini" style={{ marginTop: '10px' }}><div className="mini-job" style={{ marginTop: '0' }}></div><div className="mini-job"></div></div></div><div className="body"><p>Roles that match your profile, straight from company career pages.</p><span className="go">Find your next role <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></span></div></Link><Link className="aud door" href="/startups"><div className="head"><h3>Startups</h3><div className="sub">Engineers who ship fast</div></div><div className="vis b" data-live><div className="mini funnel-mini"><div className="r"><span>Sourced</span><i className="a-grow" style={{ '--w': '100%', '--i': '0' } as React.CSSProperties}></i><b>1,000+</b></div><div className="r"><span>Screened</span><i className="a-grow" style={{ '--w': '48%', '--i': '1' } as React.CSSProperties}></i><b>120</b></div><div className="r"><span>Benchmarked</span><i className="a-grow" style={{ '--w': '22%', '--i': '2' } as React.CSSProperties}></i><b>18</b></div><div className="r"><span>Shortlist</span><i className="a-grow" style={{ '--w': '9%', '--i': '3' } as React.CSSProperties}></i><b>5</b></div></div></div><div className="body"><p>Founding and early-team hiring. We pitch your company like a co-founder would.</p><span className="go">Hire for your startup <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></span></div></Link><Link className="aud door" href="/enterprises"><div className="head"><h3>Enterprises</h3><div className="sub">Talent behind your delivery</div></div><div className="vis c" data-cycle><div className="req-mini"><div className="mini" data-row="1"><b>SAP S/4HANA FICO Lead</b><span className="status" data-s="1"></span></div><div className="mini" data-row="2"><b>Java Microservices x4</b><span className="status" data-s="2"></span></div><div className="mini" data-row="0"><b>Power BI Developer x2</b><span className="status" data-s="0"></span></div></div></div><div className="body"><p>Permanent, augmentation and SOW delivery for SAP, data, cloud and AI roles.</p><span className="go">Partner with us <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></span></div></Link><Link className="aud door" href="/frontier-ai"><div className="head"><h3>Frontier AI</h3><div className="sub">Humans for frontier AI</div></div><div className="vis e"><div className="mini-pools"><div className="marquee"><div className="marquee-track" style={{ animationDuration: '22s' }} aria-hidden="true"><span className="pchip">Research engineers</span><span className="pchip">Post-training</span><span className="pchip">Evals</span><span className="pchip">Interpretability</span><span className="pchip">Research engineers</span><span className="pchip">Post-training</span><span className="pchip">Evals</span><span className="pchip">Interpretability</span></div></div><div className="marquee"><div className="marquee-track rev" style={{ animationDuration: '27s' }} aria-hidden="true"><span className="pchip">Telugu</span><span className="pchip">Hindi</span><span className="pchip">Tamil</span><span className="pchip">Kannada</span><span className="pchip">Marathi</span><span className="pchip">Telugu</span><span className="pchip">Hindi</span><span className="pchip">Tamil</span><span className="pchip">Kannada</span><span className="pchip">Marathi</span></div></div><div className="marquee"><div className="marquee-track" style={{ animationDuration: '32s' }} aria-hidden="true"><span className="pchip">Mathematics</span><span className="pchip">Medicine</span><span className="pchip">Law</span><span className="pchip">Finance</span><span className="pchip">Physics</span><span className="pchip">Mathematics</span><span className="pchip">Medicine</span><span className="pchip">Law</span><span className="pchip">Finance</span><span className="pchip">Physics</span></div></div></div></div><div className="body"><p>Selective talent for the most ambitious AI labs and research teams.</p><span className="go">Hire at the frontier <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></span></div></Link></div>
        <Link className="iit-strip" href="/iit-talent"><span className="pill-n">IIT Talent</span><span className="t">Went to an IIT, or doing top 1% work? Skip the pile and start at the founder.</span><span className="go">Apply to join <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></span></Link>
      </section>
      <section className="wrap section pt0">
        <div className="section-head center"><h2 className="d2">Fast for founders. Covered for <em>everyone</em>.</h2></div>
        <div className="stat-tiles">
        <div className="stile"><div className="big"><span data-odo="2">2</span><small>days</small></div><div className="viz"><div className="days" data-days="7" data-fill="2"></div></div><div className="cap">To start interviewing</div></div>
        <div className="stile"><div className="big"><span data-odo="2">2</span><small>weeks</small></div><div className="viz"><div className="days w14" data-days="14" data-fill="14" data-end="1"></div></div><div className="cap">To roll out the offer</div></div>
        <div className="stile"><div className="big"><span data-odo="90">90</span><small>days</small></div><div className="viz"><div className="ring-wrap" data-ring><svg className="odo-ring" viewBox="0 0 44 44"><circle className="bgc" cx="22" cy="22" r="18" /><circle className="fg" cx="22" cy="22" r="18" /></svg>Covered, start to finish</div></div><div className="cap">Replacement guarantee</div></div>
        <div className="stile"><div className="big"><span data-odo="10">10</span><small>K+</small></div><div className="viz"><div className="pool" data-pool="36"></div></div><div className="cap">Top talent pool from startups</div></div>
      </div>
      </section>
      <section className="wrap section pt0">
        <div className="proof"><span><span className="yc" aria-hidden="true">Y</span> YC-backed teams</span><span>VC-funded, Seed to Series D</span><span>Enterprise IT services</span><span>Frontier AI labs</span></div>
      </section>
      <section className="section-tight"><div className="wrap">
        <div className="cta-band">
          <h2 className="d2">Let's build the team that moves your vision forward.</h2>
          <div className="acts">
            <p>Founders, delivery leaders and engineers all start in the same place. Tell us what you need.</p>
            <div className="btns"><Link className="btn btn-light" href="/startups#brief">Hire talent</Link><Link className="btn btn-outline-light" href="/jobs">Find jobs</Link></div>
          </div>
        </div>
      </div></section>
    </main>
  )
}
