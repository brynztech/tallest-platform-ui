import type React from 'react'
import type { Metadata } from 'next'
import { HOME_URL } from '../_lib/site'
import Link from 'next/link'

export const metadata: Metadata = {
  title: { absolute: "Brynz Frontier AI" },
  description: "Humans for frontier AI. Selective talent for the most ambitious AI labs and research teams.",
  alternates: { canonical: `${HOME_URL}/frontier-ai` },
}

export default function FrontierAiPage() {
  return (
    <main>
      <section className="wrap hero">
        <span className="trust rise">Selective talent for ambitious labs</span>
        <h1 className="d1 fit rise r1">Humans for <em>Frontier AI</em>.</h1>
        <p className="lede rise r2">Researchers, engineers and domain experts for the most ambitious AI labs and research teams.</p>
        <div className="hero-ctas rise r3"><a className="btn btn-primary" href="#lab">Hire for your lab</a><a className="btn btn-ghost" href="#pools">Explore talent pools</a></div>

      </section>
      <section className="section wrap pt0" id="pools" style={{ scrollMarginTop: '90px' }}>
        <div className="section-head center"><h2 className="d2">Talent pools, ready to <em>deploy</em>.</h2><p className="lede">Languages, technology and domain expertise, mapped by what people have actually built.</p></div>
        <div className="pools-wall"><div className="prow"><div className="lab">Languages</div><div className="marquee"><div className="marquee-track" style={{ animationDuration: '38s' }} aria-hidden="true"><span className="pchip">Telugu</span><span className="pchip">Hindi</span><span className="pchip">Tamil</span><span className="pchip">Kannada</span><span className="pchip">Malayalam</span><span className="pchip">Marathi</span><span className="pchip">Bengali</span><span className="pchip">Gujarati</span><span className="pchip">Punjabi</span><span className="pchip">Urdu</span><span className="pchip">Odia</span><span className="pchip">Assamese</span><span className="pchip">English</span><span className="pchip">Arabic</span><span className="pchip">Spanish</span><span className="pchip">French</span><span className="pchip">German</span><span className="pchip">Japanese</span><span className="pchip">Telugu</span><span className="pchip">Hindi</span><span className="pchip">Tamil</span><span className="pchip">Kannada</span><span className="pchip">Malayalam</span><span className="pchip">Marathi</span><span className="pchip">Bengali</span><span className="pchip">Gujarati</span><span className="pchip">Punjabi</span><span className="pchip">Urdu</span><span className="pchip">Odia</span><span className="pchip">Assamese</span><span className="pchip">English</span><span className="pchip">Arabic</span><span className="pchip">Spanish</span><span className="pchip">French</span><span className="pchip">German</span><span className="pchip">Japanese</span></div><span className="sr">Telugu, Hindi, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, Urdu, Odia, Assamese, English, Arabic, Spanish, French, German, Japanese</span></div></div><div className="prow"><div className="lab">Technology</div><div className="marquee"><div className="marquee-track rev" style={{ animationDuration: '44s' }} aria-hidden="true"><span className="pchip">Python</span><span className="pchip">PyTorch</span><span className="pchip">JAX</span><span className="pchip">CUDA</span><span className="pchip">Triton</span><span className="pchip">Rust</span><span className="pchip">C++</span><span className="pchip">Kubernetes</span><span className="pchip">Ray</span><span className="pchip">vLLM</span><span className="pchip">Distributed training</span><span className="pchip">Inference optimisation</span><span className="pchip">Data pipelines</span><span className="pchip">RLHF tooling</span><span className="pchip">Python</span><span className="pchip">PyTorch</span><span className="pchip">JAX</span><span className="pchip">CUDA</span><span className="pchip">Triton</span><span className="pchip">Rust</span><span className="pchip">C++</span><span className="pchip">Kubernetes</span><span className="pchip">Ray</span><span className="pchip">vLLM</span><span className="pchip">Distributed training</span><span className="pchip">Inference optimisation</span><span className="pchip">Data pipelines</span><span className="pchip">RLHF tooling</span></div><span className="sr">Python, PyTorch, JAX, CUDA, Triton, Rust, C++, Kubernetes, Ray, vLLM, Distributed training, Inference optimisation, Data pipelines, RLHF tooling</span></div></div><div className="prow"><div className="lab">Domain expertise</div><div className="marquee"><div className="marquee-track" style={{ animationDuration: '50s' }} aria-hidden="true"><span className="pchip">Mathematics</span><span className="pchip">Physics</span><span className="pchip">Chemistry</span><span className="pchip">Biology</span><span className="pchip">Medicine</span><span className="pchip">Law</span><span className="pchip">Finance</span><span className="pchip">Accounting</span><span className="pchip">ERP and SAP</span><span className="pchip">Software engineering</span><span className="pchip">Economics</span><span className="pchip">Education</span><span className="pchip">Mathematics</span><span className="pchip">Physics</span><span className="pchip">Chemistry</span><span className="pchip">Biology</span><span className="pchip">Medicine</span><span className="pchip">Law</span><span className="pchip">Finance</span><span className="pchip">Accounting</span><span className="pchip">ERP and SAP</span><span className="pchip">Software engineering</span><span className="pchip">Economics</span><span className="pchip">Education</span></div><span className="sr">Mathematics, Physics, Chemistry, Biology, Medicine, Law, Finance, Accounting, ERP and SAP, Software engineering, Economics, Education</span></div></div><div className="prow"><div className="lab">Role families</div><div className="marquee"><div className="marquee-track rev" style={{ animationDuration: '56s' }} aria-hidden="true"><span className="pchip">Research engineers</span><span className="pchip">Applied scientists</span><span className="pchip">Post-training</span><span className="pchip">Evals and red-teaming</span><span className="pchip">Interpretability</span><span className="pchip">MLOps</span><span className="pchip">Inference infra</span><span className="pchip">Full-stack AI</span><span className="pchip">Head of AI</span><span className="pchip">Founding AI leads</span><span className="pchip">Research engineers</span><span className="pchip">Applied scientists</span><span className="pchip">Post-training</span><span className="pchip">Evals and red-teaming</span><span className="pchip">Interpretability</span><span className="pchip">MLOps</span><span className="pchip">Inference infra</span><span className="pchip">Full-stack AI</span><span className="pchip">Head of AI</span><span className="pchip">Founding AI leads</span></div><span className="sr">Research engineers, Applied scientists, Post-training, Evals and red-teaming, Interpretability, MLOps, Inference infra, Full-stack AI, Head of AI, Founding AI leads</span></div></div></div>
      </section>

      <section className="section wrap pt0">
        <div className="section-head center"><h2 className="d2">Roles we focus <em>on</em>.</h2></div>
        <div className="bento"><div><div className="glyph">RE</div><h3 className="h4">Research engineers</h3><p>Model training, evaluation, novel architectures.</p></div><div><div className="glyph">AAI</div><h3 className="h4">Applied AI</h3><p>Productizing models, agent systems, RAG.</p></div><div><div className="glyph">Infra</div><h3 className="h4">MLOps and infrastructure</h3><p>Training clusters, inference, data pipelines.</p></div><div><div className="glyph">Safety</div><h3 className="h4">Safety and alignment</h3><p>Evaluation, red-teaming, interpretability.</p></div><div><div className="glyph">&lt;/&gt;</div><h3 className="h4">Full-stack AI</h3><p>End-to-end product engineers for AI-native apps.</p></div><div><div className="glyph">Lead</div><h3 className="h4">Leadership</h3><p>Head of AI, research leads, founding AI roles.</p></div></div>
      </section>

      <section className="section wrap pt0">
        <div className="section-head center"><h2 className="d2">How Frontier hiring <em>works</em>.</h2><p className="lede">A deliberately small funnel, from the research bar to a shortlist worth calling.</p></div>
        <div className="flow" data-flow data-dur="3.4">
        <ul className="flow-steps" role="tablist" aria-label="Stages"><li><button type="button" role="tab" id="fb0" aria-controls="fs0" aria-selected="true"><span className="day">Week 0</span><b>Scope the bet</b><span>Research agenda, bar and why now</span><span className="bar"><i></i></span></button></li><li><button type="button" role="tab" id="fb1" aria-controls="fs1" aria-selected="false"><span className="day">Week 1</span><b>Map the field</b><span>Papers, open source, lab alumni</span><span className="bar"><i></i></span></button></li><li><button type="button" role="tab" id="fb2" aria-controls="fs2" aria-selected="false"><span className="day">Week 1</span><b>Outreach</b><span>We sell the problem before the title</span><span className="bar"><i></i></span></button></li><li><button type="button" role="tab" id="fb3" aria-controls="fs3" aria-selected="false"><span className="day">Week 2</span><b>Shortlist</b><span>Few names, each worth a call</span><span className="bar"><i></i></span></button></li></ul>
        <div className="window"><div className="window-bar"><div className="dots"><i></i><i></i><i></i></div><div className="url">brynz.io/frontier/post-training-team</div></div><div className="stage"><div className="scene" id="fs0" role="tabpanel" aria-labelledby="fb0"><div className="row a-in"><h4>Search brief</h4><span className="pill-n">Scoping call, 30 min</span></div>
      <dl className="kv">
        <dt className="a-in" style={{ '--i': '1' } as React.CSSProperties}>Team</dt><dd className="a-in" style={{ '--i': '1' } as React.CSSProperties}>Frontier AI lab, post-training</dd>
        <dt className="a-in" style={{ '--i': '2' } as React.CSSProperties}>Roles</dt><dd className="a-in" style={{ '--i': '2' } as React.CSSProperties}>2 research engineers, 40 expert graders</dd>
        <dt className="a-in" style={{ '--i': '3' } as React.CSSProperties}>The bar</dt><dd className="a-in" style={{ '--i': '3' } as React.CSSProperties}>Shipped RL at scale, or published on it</dd>
        <dt className="a-in" style={{ '--i': '4' } as React.CSSProperties}>Graders</dt><dd className="a-in" style={{ '--i': '4' } as React.CSSProperties}>Telugu-native, maths degree or higher</dd>
      </dl>
      <div className="a-in" style={{ '--i': '5' } as React.CSSProperties}><div className="chips"><span className="chip on">RLHF</span><span className="chip on">Reward modelling</span><span className="chip on">Telugu</span><span className="chip on">Mathematics</span></div></div>
      <div className="row a-in" style={{ '--i': '6' } as React.CSSProperties}><span className="pill-ok">Bar agreed</span><span className="small">Next: map the field</span></div></div><div className="scene" id="fs1" role="tabpanel" aria-labelledby="fb1" hidden><div className="row a-in"><div><div className="counter"><span data-count="312" data-repeat>312</span></div><div className="small">people mapped against the bar</div></div><span className="pill-n">Built, not claimed</span></div>
      <div className="chan a-in" style={{ '--i': '1' } as React.CSSProperties}><span>Papers and preprints</span><i className="a-grow" style={{ '--w': '70%', '--i': '1' } as React.CSSProperties}></i><b>84</b></div>
      <div className="chan a-in" style={{ '--i': '2' } as React.CSSProperties}><span>Open-source work</span><i className="a-grow" style={{ '--w': '55%', '--i': '2' } as React.CSSProperties}></i><b>66</b></div>
      <div className="chan a-in" style={{ '--i': '3' } as React.CSSProperties}><span>Lab alumni</span><i className="a-grow" style={{ '--w': '30%', '--i': '3' } as React.CSSProperties}></i><b>37</b></div>
      <div className="chan a-in" style={{ '--i': '4' } as React.CSSProperties}><span>Brynz expert network</span><i className="a-grow" style={{ '--w': '100%', '--i': '4' } as React.CSSProperties}></i><b>125</b></div></div><div className="scene" id="fs2" role="tabpanel" aria-labelledby="fb2" hidden><div className="row a-in"><h4>Outreach</h4><span className="pill-n">Problem first, title second</span></div>
      <div className="thread-l">
        <div className="ml out a-in" style={{ '--i': '1' } as React.CSSProperties}><span className="meta">Brynz</span>Your reward-hacking paper is exactly the failure mode this team is fighting. They'd like you to own the fix.</div>
        <div className="ml in a-in" style={{ '--i': '3' } as React.CSSProperties}><span className="meta">Research engineer</span>That's the problem I'd want to work on. Who's on the team?</div>
        <div className="ml sys a-in" style={{ '--i': '5' } as React.CSSProperties}>Call with the research lead booked</div>
      </div></div><div className="scene" id="fs3" role="tabpanel" aria-labelledby="fb3" hidden><div className="row a-in"><h4>Shortlist</h4><span className="pill-ok">Ready in 2 weeks</span></div>
      <div className="cand a-in" style={{ '--i': '1' } as React.CSSProperties}><div className="av" style={{ background: '#3F3A8C' }}>VR</div><div className="who"><b>Shipped RLHF for a 70B model</b><span>Research engineer, 2 papers on reward models</span></div><div className="fitbar">97% fit<i className="a-grow" style={{ '--w': '97%', '--i': '1' } as React.CSSProperties}></i></div></div>
      <div className="cand a-in" style={{ '--i': '2' } as React.CSSProperties}><div className="av" style={{ background: '#1F4E79' }}>SK</div><div className="who"><b>Built eval harness used across a lab</b><span>Research engineer, open-source maintainer</span></div><div className="fitbar">93% fit<i className="a-grow" style={{ '--w': '93%', '--i': '2' } as React.CSSProperties}></i></div></div>
      <div className="cand a-in" style={{ '--i': '3' } as React.CSSProperties}><div className="av" style={{ background: '#1F5C55' }}>40</div><div className="who"><b>Telugu-native maths graders</b><span>MSc and PhD, calibrated on sample tasks</span></div><div className="fitbar">Ready<i className="a-grow" style={{ '--w': '100%', '--i': '3' } as React.CSSProperties}></i></div></div></div></div></div>
      </div>

      </section>

      <section className="section wrap pt0" id="lab" style={{ scrollMarginTop: '90px' }}>
        <div className="note">
          <div className="copy">
            <h2 className="d2">Hire at the <em>frontier</em>.</h2>
            <p className="lede">Tell us the problem this hire will own. We come back with a map of who can solve it.</p>
            <p className="sig-line">Every note is read by a Brynz partner, not a bot.</p>
          </div>
          <form className="note-form" data-form data-title="Frontier AI hiring" noValidate>
            <div className="field"><label htmlFor="lab-email">Work email</label><input id="lab-email" name="lab-email" type="email" data-label="Work email" placeholder="you@company.com" required autoComplete="email" /><span className="err">Enter a valid email address.</span></div>
            <div className="field"><label htmlFor="lab-msg">What should this person own?</label><textarea id="lab-msg" name="lab-msg" data-label="What should this person own?" placeholder="Post-training lead for a reasoning model team. Or 40 Telugu-native math graders." required></textarea><span className="err">Tell us a little about what you need.</span></div>
            <div className="foot"><span className="fine">We reach out within one business day.</span><button className="btn btn-primary" type="submit">Start a Frontier search</button></div>
          </form>
        </div>
      </section>
      <section className="section-tight"><div className="wrap">
        <div className="cta-band">
          <h2 className="d2">Ready to hire, or join, at the frontier?</h2>
          <div className="acts">
            <p>Selective talent for your lab, or your next frontier role.</p>
            <div className="btns"><a className="btn btn-light" href="#lab">Hire for Frontier</a><Link className="btn btn-outline-light" href="/jobs">See open roles</Link></div>
          </div>
        </div>
      </div></section>
    </main>
  )
}
