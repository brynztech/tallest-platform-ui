import type React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: { absolute: "Brynz for Startups" },
  description: "Hiring tech talent for high-growth startups. Engineers who ship fast and solve hard problems.",
  alternates: { canonical: '/startups' },
}

export default function StartupsPage() {
  return (
    <main>
      <section className="wrap hero">
        <Link className="trust rise" href="/startups">Trusted by 10+ <span className="yc" aria-hidden="true">Y</span><b>YC &amp; VC funded startups</b></Link>
        <h1 className="d1 fit rise r1">Engineers who ship <em>fast</em>.</h1>
        <p className="lede rise r2">Founding and early-team hiring for high-growth startups. We pitch your company like a co-founder would.</p>
        <div className="hero-ctas rise r3"><a className="btn btn-primary" href="#brief">Get 5 vetted profiles</a><a className="btn btn-ghost" href="https://cal.com/brynztech" target="_blank" rel="noopener">Book a kickoff call</a></div>

      </section>
      <section className="section wrap pt0">
        <div className="section-head center"><h2 className="d2">The best engineers aren't <em>applying</em>.</h2></div>
        <div className="vpair">
        <div className="vcard"><div className="vis a" data-live>
          <div className="profile">
            <div className="mini notif"><span className="lg"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16v10H8l-4 4z" /></svg></span><div><b style={{ fontSize: '.86rem' }}>Brynz</b><div className="small" style={{ fontSize: '.8rem' }}>Your edge inference work is exactly what they need.</div></div></div>
            <div className="mini"><div className="top"><span className="av"></span><div><b>Senior ML Engineer</b><span>Series B, 6 yrs, well paid</span></div></div><div className="toggle-row" style={{ marginTop: '10px' }}>Open to work<span className="sw"></span></div></div>
          </div>
        </div><div className="txt"><h3 className="d3">They're employed, well paid and not looking.</h3><p>A job post won't move them. Your story will.</p></div></div>
        <div className="vcard"><div className="vis b" data-live>
          <div className="digest mini">
            <div className="dg-head"><span className="lg-dot"></span><b>Brynz</b><span>Weekly hiring digest</span></div>
            <div className="drow a-in" style={{ '--i': '1' } as React.CSSProperties}><span>Applications screened for you</span><b className="tnum" data-count="1148" data-repeat>1,148</b></div>
            <div className="drow a-in" style={{ '--i': '2' } as React.CSSProperties}><span>Technical screens run</span><b className="tnum" data-count="42" data-repeat>42</b></div>
            <div className="drow a-in" style={{ '--i': '3' } as React.CSSProperties}><span>CVs you had to read</span><b className="tnum">0</b></div>
            <div className="drow hi a-in" style={{ '--i': '4' } as React.CSSProperties}><span>Benchmarked profiles ready</span><span className="pill-ok">5 to review</span></div>
            <div className="drow a-in" style={{ '--i': '5' } as React.CSSProperties}><span>Your time on hiring this week</span><b>45 min</b></div>
          </div>
        </div><div className="txt"><h3 className="d3">Hiring shouldn't pull you away from building.</h3><p>We screen every application and run every first round. You get a short list and a short meeting.</p></div></div>
      </div>
      </section>

      <section className="wrap section pt0">
        <div className="stat-tiles">
        <div className="stile"><div className="big"><span data-odo="2">2</span><small>days</small></div><div className="viz"><div className="days" data-days="7" data-fill="2"></div></div><div className="cap">To start interviewing</div></div>
        <div className="stile"><div className="big"><span data-odo="2">2</span><small>weeks</small></div><div className="viz"><div className="days w14" data-days="14" data-fill="14" data-end="1"></div></div><div className="cap">To roll out the offer</div></div>
        <div className="stile"><div className="big"><span data-odo="90">90</span><small>days</small></div><div className="viz"><div className="ring-wrap" data-ring><svg className="odo-ring" viewBox="0 0 44 44"><circle className="bgc" cx="22" cy="22" r="18" /><circle className="fg" cx="22" cy="22" r="18" /></svg>Covered, start to finish</div></div><div className="cap">Replacement guarantee</div></div>
        <div className="stile"><div className="big"><span data-odo="10">10</span><small>K+</small></div><div className="viz"><div className="pool" data-pool="36"></div></div><div className="cap">Top talent pool from startups</div></div>
      </div>
      </section>

      <section className="section wrap pt0">
        <div className="section-head"><h2 className="d2">We understand the <em>hustle</em>.</h2><p className="lede">You're shipping, selling and fundraising at once. Hiring shouldn't become a fourth job.</p></div>
        <div className="hustle">
        <div className="hcard"><div className="vis"><div className="pitch" data-pitch="They're six people, live with paying customers and growing fast. You'd own the core platform from day one.|The founders have built this before. The problem is hard and the timing is now.|Small team, real equity, and the hardest problem you'll have worked on."><span className="who">Brynz, to a senior engineer</span><span className="t"></span><span className="caret"></span></div></div>
          <div className="txt"><h3 className="d3">We pitch like a co-founder</h3><p>We learn the problem, the market and why now. Candidates show up already bought in.</p></div></div>
        <div className="hcard"><div className="vis"><div className="kw" data-kw><span>10 yrs experience</span><span data-keep="1">Shipped 0 to 1</span><span>Rockstar</span><span data-keep="1">Owned prod on-call</span><span>Buzzword stack</span><span data-keep="1">Early-team seat</span><span>Ninja</span></div></div>
          <div className="txt"><h3 className="d3">Builders, not resumes</h3><p>Every profile is benchmarked against your ideal hire. Keyword-stuffed CVs never reach you.</p></div></div>
        <div className="hcard"><div className="vis"><div className="week"><div className="d"><b>Mon</b><i className="build"></i><i className="build"></i><i className="iv"></i><i className="build"></i></div><div className="d"><b>Tue</b><i className="build"></i><i className="build"></i><i className="build"></i><i className="build"></i></div><div className="d"><b>Wed</b><i className="build"></i><i className="iv"></i><i className="build"></i><i className="build"></i></div><div className="d"><b>Thu</b><i className="build"></i><i className="build"></i><i className="build"></i><i className="build"></i></div><div className="d"><b>Fri</b><i className="build"></i><i className="build"></i><i className="build"></i><i className=""></i></div></div><div className="legend"><span><i style={{ background: 'var(--bar)' } as React.CSSProperties}></i>Building</span><span><i style={{ background: 'var(--yc)' } as React.CSSProperties}></i>Interviews</span></div></div>
          <div className="txt"><h3 className="d3">You stay on the product</h3><p>We run sourcing, screening and scheduling. You show up for the conversations that matter.</p></div></div>
      </div>
      </section>

      <section className="wrap section pt0"><div className="funnel">
        <canvas data-funnel aria-hidden="true"></canvas>
        <div className="title"><span className="dot-live"></span>One founding search, start to shortlist</div>
        <div className="labels"><div><b>1,000+</b><span>Applications screened</span></div><div><b>120</b><span>Technical screens</span></div><div><b>18</b><span>Benchmarked</span></div><div><b>5</b><span>Bought-in shortlist</span></div></div>
      </div></section>

      <section className="section wrap pt0" id="hire">
        <div className="section-head"><h2 className="d2">What we hire</h2></div>
        <div className="bento"><div><div className="glyph">AI</div><h3 className="h4">AI / ML</h3><div className="chips"><span className="chip">LLMs</span><span className="chip">Applied AI</span><span className="chip">Computer vision</span></div></div><div><div className="glyph">API</div><h3 className="h4">Backend and infra</h3><div className="chips"><span className="chip">Go</span><span className="chip">Python</span><span className="chip">Distributed systems</span></div></div><div><div className="glyph">&lt;/&gt;</div><h3 className="h4">Full-stack</h3><div className="chips"><span className="chip">React</span><span className="chip">Node</span><span className="chip">TypeScript</span></div></div><div><div className="glyph">SQL</div><h3 className="h4">Data</h3><div className="chips"><span className="chip">Pipelines</span><span className="chip">Warehousing</span><span className="chip">Analytics</span></div></div><div><div className="glyph">K8s</div><h3 className="h4">Cloud and DevOps</h3><div className="chips"><span className="chip">AWS</span><span className="chip">Kubernetes</span><span className="chip">Terraform</span></div></div><div><div className="glyph">GTM</div><h3 className="h4">Early GTM</h3><div className="chips"><span className="chip">Founding AEs</span><span className="chip">Sales engineers</span><span className="chip">FDEs</span></div></div></div>
      </section>

      <section className="section wrap pt0" id="process">
        <div className="section-head"><h2 className="d2">Your time, <em>protected</em>.</h2><p className="lede">A founding search from kickoff to signed offer. You show up for the moments that need you.</p></div>
        <div className="flow" data-flow data-dur="3.4">
        <ul className="flow-steps" role="tablist" aria-label="Search stages"><li><button type="button" role="tab" id="fs0" aria-controls="sc0" aria-selected="true"><span className="day">Day 0</span><b>Kickoff</b><span>30 minutes on the role and the pitch</span><span className="bar"><i></i></span></button></li><li><button type="button" role="tab" id="fs1" aria-controls="sc1" aria-selected="false"><span className="day">Day 2</span><b>Shortlist</b><span>Benchmarked, bought-in builders</span><span className="bar"><i></i></span></button></li><li><button type="button" role="tab" id="fs2" aria-controls="sc2" aria-selected="false"><span className="day">Day 7</span><b>Interviews</b><span>Only people worth your time</span><span className="bar"><i></i></span></button></li><li><button type="button" role="tab" id="fs3" aria-controls="sc3" aria-selected="false"><span className="day">Day 14</span><b>Offer</b><span>We handle the close</span><span className="bar"><i></i></span></button></li></ul>
        <div className="window"><div className="window-bar"><div className="dots"><i></i><i></i><i></i></div><div className="url">brynz.io/search/founding-ml-engineer</div></div><div className="stage">
      <div className="scene" id="sc0" role="tabpanel" aria-labelledby="fs0">
        <div className="row a-in"><h4>Hiring brief</h4><span className="pill-n">Kickoff call, 30 min</span></div>
        <dl className="kv">
          <dt className="a-in" style={{ '--i': '1' } as React.CSSProperties}>Company</dt><dd className="a-in" style={{ '--i': '1' } as React.CSSProperties}>Seed-stage AI startup</dd>
          <dt className="a-in" style={{ '--i': '2' } as React.CSSProperties}>Role</dt><dd className="a-in" style={{ '--i': '2' } as React.CSSProperties}>Founding ML Engineer</dd>
          <dt className="a-in" style={{ '--i': '3' } as React.CSSProperties}>Location</dt><dd className="a-in" style={{ '--i': '3' } as React.CSSProperties}>India, onsite</dd>
          <dt className="a-in" style={{ '--i': '4' } as React.CSSProperties}>Why now</dt><dd className="a-in" style={{ '--i': '4' } as React.CSSProperties}>Customers are live. The model has to hold up in production.</dd>
          <dt className="a-in" style={{ '--i': '5' } as React.CSSProperties}>The pitch</dt><dd className="a-in" style={{ '--i': '5' } as React.CSSProperties}>Own the ML stack from day one, next to the founders.</dd>
        </dl>
        <div className="a-in" style={{ '--i': '6' } as React.CSSProperties}><div className="small" style={{ marginBottom: '8px' }}>Benchmark profile</div><div className="chips"><span className="chip on">PyTorch</span><span className="chip on">Edge inference</span><span className="chip on">Shipped from an early seat</span><span className="chip">Founding equity</span><span className="chip">0 to 1 ownership</span></div></div>
        <div className="row a-in" style={{ '--i': '7' } as React.CSSProperties}><span className="pill-ok">Benchmark locked</span><span className="small">Next: shortlist in 48 hours</span></div>
      </div>
      <div className="scene" id="sc1" role="tabpanel" aria-labelledby="fs1" hidden>
        <div className="row a-in"><div><div className="counter"><span data-count="1148" data-repeat>1,148</span></div><div className="small">profiles reviewed for this search</div></div><span className="pill-ok">5 bought in</span></div>
        <div><div className="cand a-in" style={{ '--i': '1' } as React.CSSProperties}><div className="av" style={{ background: '#3F3A8C' }}>AK</div><div className="who"><b>Shipped edge inference from a seed seat</b><span>5 yrs, PyTorch, TensorRT</span></div><div className="fitbar">96% fit<i className="a-grow" style={{ '--w': '96%', '--i': '1' } as React.CSSProperties}></i></div></div><div className="cand a-in" style={{ '--i': '2' } as React.CSSProperties}><div className="av" style={{ background: '#1F4E79' }}>RS</div><div className="who"><b>Built a CV pipeline used on factory floors</b><span>6 yrs, OpenCV, Kafka</span></div><div className="fitbar">93% fit<i className="a-grow" style={{ '--w': '93%', '--i': '2' } as React.CSSProperties}></i></div></div><div className="cand a-in" style={{ '--i': '3' } as React.CSSProperties}><div className="av" style={{ background: '#7A3B1E' }}>MN</div><div className="who"><b>Took a model from notebook to 99.9% uptime</b><span>4 yrs, MLOps, AWS, Triton</span></div><div className="fitbar">91% fit<i className="a-grow" style={{ '--w': '91%', '--i': '3' } as React.CSSProperties}></i></div></div><div className="cand a-in" style={{ '--i': '4' } as React.CSSProperties}><div className="av" style={{ background: '#1F5C55' }}>PV</div><div className="who"><b>Founding engineer, robotics perception</b><span>7 yrs, C++, CUDA</span></div><div className="fitbar">88% fit<i className="a-grow" style={{ '--w': '88%', '--i': '4' } as React.CSSProperties}></i></div></div><div className="cand a-in" style={{ '--i': '5' } as React.CSSProperties}><div className="av" style={{ background: '#5B2A4E' }}>DJ</div><div className="who"><b>Led on-device ML at a Series B</b><span>6 yrs, ONNX, Android NN</span></div><div className="fitbar">86% fit<i className="a-grow" style={{ '--w': '86%', '--i': '5' } as React.CSSProperties}></i></div></div></div>
      </div>
      <div className="scene" id="sc2" role="tabpanel" aria-labelledby="fs2" hidden>
        <div className="row a-in"><h4>Interview loop, week 1</h4><span className="pill-n">5 interviews booked</span></div>
        <div className="cal"><span></span><span className="h">Mon</span><span className="h">Tue</span><span className="h">Wed</span><span className="h">Thu</span><span className="h">Fri</span><span className="t">10:00</span><span className="c"></span><span className="c"></span><span className="c slot  a-pop" style={{ '--i': '1' } as React.CSSProperties}>MN, founder</span><span className="c"></span><span className="c"></span><span className="t">12:00</span><span className="c slot  a-pop" style={{ '--i': '2' } as React.CSSProperties}>AK, founder</span><span className="c"></span><span className="c"></span><span className="c"></span><span className="c slot  a-pop" style={{ '--i': '3' } as React.CSSProperties}>RS, founder</span><span className="t">15:00</span><span className="c"></span><span className="c slot b a-pop" style={{ '--i': '4' } as React.CSSProperties}>RS, tech round</span><span className="c"></span><span className="c slot b a-pop" style={{ '--i': '5' } as React.CSSProperties}>AK, CTO</span><span className="c"></span><span className="t">17:00</span><span className="c"></span><span className="c"></span><span className="c"></span><span className="c"></span><span className="c"></span></div>
        <div className="row a-in" style={{ '--i': '6' } as React.CSSProperties}><span className="small">Brynz coordinates every slot, prep note and debrief.</span><span className="pill-ok">0 hours of founder scheduling</span></div>
      </div>
      <div className="scene" id="sc3" role="tabpanel" aria-labelledby="fs3" hidden>
        <div className="offer a-in">
          <div className="stamp a-stamp">OFFER<br />SIGNED<br />DAY 13</div>
          <h4>Offer letter</h4>
          <dl className="kv"><dt>Candidate</dt><dd>A.K.</dd><dt>Role</dt><dd>Founding ML Engineer</dd><dt>Start</dt><dd>In 3 weeks</dd><dt>Closed by</dt><dd>Brynz, with the founders</dd></dl>
          <div className="sig">A. K.</div>
        </div>
        <div className="row a-in" style={{ '--i': '3' } as React.CSSProperties}><span className="pill-ok">90-day replacement guarantee active</span><span className="small">Founder time: a few hours, not weeks</span></div>
      </div></div></div>
      </div>

      </section>

      <section className="section wrap pt0" id="trusted">
        <div className="section-head center"><h2 className="d2">Trusted by 10+ YC &amp; VC funded startups.</h2><p className="lede">From first engineer to first ten, across Seed to Series D.</p></div>
        <div className="proof"><span><span className="yc" aria-hidden="true">Y</span> YC-backed founders</span><span>VC-funded, Seed to Series D</span><span>Founding and early teams</span><span>Permanent hires only</span></div>
      </section>

      <section className="section wrap pt0" id="brief" style={{ scrollMarginTop: '90px' }}>
        <div className="note">
          <div className="copy">
            <h2 className="d2">Tell us who you're <em>looking for</em>.</h2>
            <p className="lede">One line about the role is enough. We'll come back with a benchmark profile and a time to talk.</p>
            <p className="sig-line">Every note is read by a Brynz partner, not a bot.</p>
          </div>
          <form className="note-form" data-form data-title="Startup hiring brief" noValidate>
            <div className="field"><label htmlFor="brief-email">Work email</label><input id="brief-email" name="brief-email" type="email" data-label="Work email" placeholder="you@company.com" required autoComplete="email" /><span className="err">Enter a valid email address.</span></div>
            <div className="field"><label htmlFor="brief-msg">What are you looking for?</label><textarea id="brief-msg" name="brief-msg" data-label="What are you looking for?" placeholder="Founding ML engineer, onsite, strong on edge inference. Ideally has shipped from an early seat." required></textarea><span className="err">Tell us a little about what you need.</span></div>
            <div className="foot"><span className="fine">We reach out within one business day.</span><button className="btn btn-primary" type="submit">Start my search</button></div>
          </form>
        </div>
      </section>
      <section className="section-tight"><div className="wrap">
        <div className="cta-band">
          <h2 className="d2">Let's hire the people who move your vision forward.</h2>
          <div className="acts">
            <p>Pre-vetted engineers who ship. You stay focused on the product.</p>
            <div className="btns"><a className="btn btn-light" href="#brief">Get 5 vetted profiles</a><a className="btn btn-outline-light" href="https://cal.com/brynztech" target="_blank" rel="noopener">Book a kickoff</a></div>
          </div>
        </div>
      </div></section>
    </main>
  )
}
