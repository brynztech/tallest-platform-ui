import type React from 'react'
import Link from 'next/link'

/** The static half of the talent page: how it works, then the profile call to action. */
export function TalentSections() {
  return (
    <>
      <section className="section wrap" id="how">
        <div className="section-head center"><h2 className="d2">How Brynz <em>works</em>.</h2></div>
        <div className="hustle">
        <div className="hcard"><div className="vis" data-live><div className="tl mini">
            <div className="tl-row a-in" style={{ '--i': '1' } as React.CSSProperties}><i></i><span>Posted on company careers page</span><b>09:02</b></div>
            <div className="tl-row on a-in" style={{ '--i': '2' } as React.CSSProperties}><i></i><span>Live on Brynz, matched to you</span><b>09:04</b></div>
            <div className="tl-row off a-in" style={{ '--i': '3' } as React.CSSProperties}><i></i><span>Job board reposts</span><b>Never here</b></div>
          </div></div><div className="txt"><span className="stepn">01</span><h3 className="d3">Search for free</h3><p>Every job comes straight from a company's own career page. No job board reposts.</p></div></div>
        <div className="hcard"><div className="vis" data-live><div className="mini once">
            <div className="top"><span className="av" style={{ background: 'var(--brand)' } as React.CSSProperties}></span><div><b>Your Brynz profile</b><span>resume.pdf, uploaded once</span></div></div>
            <div className="ck a-in" style={{ '--i': '1' } as React.CSSProperties}><span className="tk"></span><span>Applied: AI Software Engineer</span></div><div className="ck a-in" style={{ '--i': '2' } as React.CSSProperties}><span className="tk"></span><span>Applied: Product Engineer</span></div><div className="ck a-in" style={{ '--i': '3' } as React.CSSProperties}><span className="tk"></span><span>Applied: Forward Deployed Engineer</span></div>
          </div></div><div className="txt"><span className="stepn">02</span><h3 className="d3">Upload your resume once</h3><p>Register when you find a role you want. One profile works for every application after that.</p></div></div>
        <div className="hcard"><div className="vis" data-live><div className="pitch" data-pitch="Hi, I'm a recruiter at Brynz. You fit a founding engineer role we're hiring for directly. Free for a 15-minute call this week?"><span className="who">Brynz recruiter, a real person</span><span className="t"></span><span className="caret"></span></div></div>
          <div className="txt"><span className="stepn">03</span><h3 className="d3">Get seen by a recruiter</h3><p>If you fit a role Brynz is hiring for directly, a recruiter reaches out. A real person, not an auto-reply.</p></div></div>
      </div>
      </section>
      
      <section className="section-tight wrap" id="profile">
        <div className="cta-band">
          <h2 className="d2">Ready for your next high-signal role?</h2>
          <div className="acts">
            <p>Create a free profile and let Brynz match you with opportunities that actually fit.</p>
            <div className="btns"><Link className="btn btn-light" href="/signup">Create profile</Link><Link className="btn btn-outline-light" href="/frontier-ai">Frontier AI roles</Link></div>
          </div>
        </div>
      </section>
    </>
  )
}
