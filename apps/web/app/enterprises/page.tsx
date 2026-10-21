import type React from 'react'
import type { Metadata } from 'next'
import { HOME_URL } from '../_lib/site'

export const metadata: Metadata = {
  title: { absolute: "Brynz for Enterprises" },
  description: "Talent partner behind your delivery. Permanent hiring, staff augmentation and SOW delivery for niche technical roles.",
  alternates: { canonical: `${HOME_URL}/enterprises` },
}

export default function EnterprisesPage() {
  return (
    <main>
      <section className="wrap hero">
        <span className="trust rise">Technical staffing partner</span>
        <h1 className="d1 fit rise r1">Talent behind your <em>delivery</em>.</h1>
        <p className="lede rise r2">Permanent hiring, staff augmentation and SOW delivery for niche SAP, data, cloud and AI roles.</p>
        <div className="hero-ctas rise r3"><a className="btn btn-primary" href="#talk">Talk to an account manager</a><a className="btn btn-ghost" href="#models">See engagement models</a></div>

      </section>
      <section className="wrap section pt0"><div className="problem">
        <div className="ph"><span className="tag-light">The problem</span><h2 className="d2">Requisitions age while profiles <em>bounce</em>.</h2></div>
        <div className="pgrid">
          <div className="pc" data-live>
            <div className="age">
              <div className="row"><b>SAP S/4HANA FICO Lead</b><span className="warn-pill">Open</span></div>
              <div className="age-n"><span data-count="38" data-repeat>38</span><small>days open</small></div>
              <i className="agebar"><i className="a-grow"></i></i>
              <div className="toast-r"><span>Profiles received</span><b>31</b></div>
              <div className="toast-r"><span>Interviews held</span><b>2</b></div>
              <div className="small-l">3 vendors engaged. 0 joiners.</div>
            </div>
            <p>Niche SAP, data and cloud roles stay open for weeks.</p>
          </div>
          <div className="pc" data-live>
            <div className="toasts">
              <div className="toast-r a-in" style={{ '--i': '1' } as React.CSSProperties}><span>Vendor A</span><b>+12 profiles</b></div>
              <div className="toast-r a-in" style={{ '--i': '2' } as React.CSSProperties}><span>Vendor B</span><b>+9 profiles</b></div>
              <div className="toast-r a-in" style={{ '--i': '3' } as React.CSSProperties}><span>Vendor C</span><b>+15 profiles</b></div>
              <div className="toast-r a-in" style={{ '--i': '4' } as React.CSSProperties}><span>Vendor D</span><b>+11 profiles</b></div>
              <div className="toast-sum a-in" style={{ '--i': '5' } as React.CSSProperties}><span data-count="47" data-repeat>47</span> profiles for your team to screen</div>
            </div>
            <p>Vendors send volume. Your team ends up screening it.</p>
          </div>
        </div>
      </div></section>

      <section className="section wrap pt0">
        <div className="section-head center"><h2 className="d2">Fewer profiles. Higher <em>hit rate</em>.</h2><p className="lede">Our recruiters have hired at scale for India's leading IT services firms, across high-volume and niche technologies.</p></div>
        <div className="compare" data-live>
        <div className="cmp"><div className="row"><b>Typical vendor</b><span className="small">Many profiles, few fits</span></div><div className="dots many"><i className="a-pop" style={{ '--i': '0' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '1' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '2' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '3' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '4' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '5' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '6' } as React.CSSProperties}></i><i className="a-pop hit" style={{ '--i': '7' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '8' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '9' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '10' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '11' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '0' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '1' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '2' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '3' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '4' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '5' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '6' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '7' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '8' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '9' } as React.CSSProperties}></i><i className="a-pop hit" style={{ '--i': '10' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '11' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '0' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '1' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '2' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '3' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '4' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '5' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '6' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '7' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '8' } as React.CSSProperties}></i><i className="a-pop hit" style={{ '--i': '9' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '10' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '11' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '0' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '1' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '2' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '3' } as React.CSSProperties}></i></div></div>
        <div className="cmp brynz"><div className="row"><b>Brynz</b><span className="small">Fewer profiles, more fits</span></div><div className="dots few"><i className="a-pop hit" style={{ '--i': '0' } as React.CSSProperties}></i><i className="a-pop hit" style={{ '--i': '1' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '2' } as React.CSSProperties}></i><i className="a-pop hit" style={{ '--i': '3' } as React.CSSProperties}></i><i className="a-pop hit" style={{ '--i': '4' } as React.CSSProperties}></i><i className="a-pop" style={{ '--i': '5' } as React.CSSProperties}></i></div></div>
      </div>

      </section>

      <section className="section wrap pt0"><div className="hustle">
        <div className="hcard"><div className="vis" data-live><div className="jd mini"><div className="jl"><i style={{ width: '80%' }}></i><i style={{ width: '60%' }}></i><i style={{ width: '70%' }}></i></div>
      <div className="chips"><span className="chip ok a-pop" style={{ '--i': '1' } as React.CSSProperties}>S/4HANA</span><span className="chip ok a-pop" style={{ '--i': '2' } as React.CSSProperties}>FICO</span><span className="chip ok a-pop" style={{ '--i': '3' } as React.CSSProperties}>Migration</span><span className="chip a-pop" style={{ '--i': '4' } as React.CSSProperties}>Buzzwords</span></div></div></div><div className="txt"><h3 className="d3">JD-matched</h3><p>Screened against the JD, not keyword-matched.</p></div></div>
        <div className="hcard"><div className="vis" data-live><div className="mini cklist"><div className="ck a-in" style={{ '--i': '1' } as React.CSSProperties}><span className="tk"></span><span>Technical round</span></div><div className="ck a-in" style={{ '--i': '2' } as React.CSSProperties}><span className="tk"></span><span>Documents verified</span></div><div className="ck a-in" style={{ '--i': '3' } as React.CSSProperties}><span className="tk"></span><span>Notice and rate confirmed</span></div></div></div><div className="txt"><h3 className="d3">Client-ready</h3><p>Properly screened profiles, every submission.</p></div></div>
        <div className="hcard"><div className="vis" data-live><div className="mini owner"><div className="top"><span className="av" style={{ background: 'var(--brand)' } as React.CSSProperties}></span><div><b>Your account manager</b><span>One owner, one escalation path</span></div></div>
      <div className="msg-l a-in" style={{ '--i': '2' } as React.CSSProperties}>Status for the week: 6 submitted, 4 shortlisted, 2 interviews Thursday.</div></div></div><div className="txt"><h3 className="d3">One owner</h3><p>One account manager, one escalation path.</p></div></div>
      </div></section>

      <section className="section wrap pt0" id="practice">
        <div className="section-head"><h2 className="d2">Deep benches where you need <em>volume</em>.</h2></div>
        <div className="bento prac"><div className="feat"><div className="glyph">SAP</div><h3 className="h4">SAP</h3><div className="chips"><span className="chip">S/4HANA</span><span className="chip">FICO</span><span className="chip">MM</span><span className="chip">SD</span><span className="chip">ABAP</span><span className="chip">BTP</span></div></div><div><div className="glyph">Java</div><h3 className="h4">Java</h3><div className="chips"><span className="chip">Spring Boot</span><span className="chip">Microservices</span><span className="chip">APIs</span></div></div><div><div className="glyph">Data</div><h3 className="h4">Data</h3><div className="chips"><span className="chip">ETL</span><span className="chip">DataStage</span><span className="chip">Power BI</span><span className="chip">Cognos</span></div></div><div><div className="glyph">Cloud</div><h3 className="h4">Cloud</h3><div className="chips"><span className="chip">AWS</span><span className="chip">Azure</span><span className="chip">Kubernetes</span><span className="chip">DevOps</span></div></div><div><div className="glyph">ERP</div><h3 className="h4">ERP and CRM</h3><div className="chips"><span className="chip">Oracle</span><span className="chip">o9</span><span className="chip">Dynamics</span><span className="chip">Salesforce</span></div></div><div><div className="glyph">AI</div><h3 className="h4">AI / ML</h3><div className="chips"><span className="chip">LLMs</span><span className="chip">MLOps</span><span className="chip">Computer vision</span></div></div></div>
      </section>

      <section className="section wrap pt0" id="industries">
        <div className="section-head"><h2 className="d2">Domain-ready talent for every major <em>vertical</em>.</h2></div>
        <div className="vgrid"><div className="vt"><div className="vt-top"><h3>BFSI</h3><span className="dot-live"></span></div><p>Core banking, payments, risk and insurance platforms.</p><div className="vt-now"><span className="small">Now staffing</span><div className="ticker" data-ticker="2200"><span>Temenos developer</span><span>Payments QA lead</span><span>Risk data analyst</span><span>Finacle consultant</span><span>Insurance BA</span></div></div></div><div className="vt"><div className="vt-top"><h3>IT services</h3><span className="dot-live"></span></div><p>Bench strength for delivery, consulting and support.</p><div className="vt-now"><span className="small">Now staffing</span><div className="ticker" data-ticker="2550"><span>SAP delivery lead</span><span>Java microservices dev</span><span>L2 support engineer</span><span>Solution architect</span></div></div></div><div className="vt"><div className="vt-top"><h3>Healthcare</h3><span className="dot-live"></span></div><p>Regulated data and pharma systems.</p><div className="vt-now"><span className="small">Now staffing</span><div className="ticker" data-ticker="2900"><span>Veeva CRM consultant</span><span>Clinical data manager</span><span>Pharma IT validation</span><span>HL7 integration dev</span></div></div></div><div className="vt"><div className="vt-top"><h3>Retail</h3><span className="dot-live"></span></div><p>Commerce, supply chain and customer platforms.</p><div className="vt-now"><span className="small">Now staffing</span><div className="ticker" data-ticker="3250"><span>OMS developer</span><span>Supply chain planner</span><span>Salesforce Commerce dev</span><span>Data engineer</span></div></div></div><div className="vt"><div className="vt-top"><h3>Manufacturing</h3><span className="dot-live"></span></div><p>ERP-heavy plants and planning teams.</p><div className="vt-now"><span className="small">Now staffing</span><div className="ticker" data-ticker="3600"><span>SAP PP/QM consultant</span><span>o9 planning consultant</span><span>MES engineer</span><span>Industry 4.0 architect</span></div></div></div><div className="vt"><div className="vt-top"><h3>Telecom and media</h3><span className="dot-live"></span></div><p>Networks and digital platforms at scale.</p><div className="vt-now"><span className="small">Now staffing</span><div className="ticker" data-ticker="3950"><span>OSS/BSS consultant</span><span>5G core engineer</span><span>Network automation dev</span><span>Media platform SRE</span></div></div></div></div>
      </section>

      <section className="section wrap pt0" id="models">
        <div className="section-head center"><h2 className="d2">Three models. One <em>standard</em>.</h2></div>
        <div className="models" data-live>
          <div className="model"><div className="dia"><svg viewBox="0 0 300 140" role="img" aria-label="Candidate, screened by Brynz, hired directly by you">
      <rect className="node" x="6" y="52" width="80" height="36" rx="10" /><text x="46" y="74" textAnchor="middle">Candidate</text>
      <rect className="node brand" x="110" y="52" width="80" height="36" rx="10" /><text className="inv" x="150" y="74" textAnchor="middle">Brynz</text>
      <rect className="node" x="214" y="52" width="80" height="36" rx="10" /><text x="254" y="74" textAnchor="middle">Your team</text>
      <path className="link" d="M86 70H110" /><path className="link" d="M190 70H214" />
      <text className="lbl" x="150" y="112" textAnchor="middle">Screen, pitch, close</text><text className="lbl" x="254" y="112" textAnchor="middle">Direct hire</text>
      </svg></div><div className="txt"><h3 className="h4">Permanent</h3><p>Direct hire for niche and leadership roles.</p><ul><li>Benchmarked shortlists</li><li>Offer and joining support</li></ul></div></div>
          <div className="model"><div className="dia"><svg viewBox="0 0 300 140" role="img" aria-label="Brynz employs and deploys the engineer to you, with the option to convert">
      <rect className="node brand" x="6" y="52" width="86" height="36" rx="10" /><text className="inv" x="49" y="74" textAnchor="middle">Brynz payroll</text>
      <rect className="node" x="118" y="52" width="70" height="36" rx="10" /><text x="153" y="74" textAnchor="middle">Engineer</text>
      <rect className="node" x="214" y="52" width="80" height="36" rx="10" /><text x="254" y="74" textAnchor="middle">Your team</text>
      <path className="link" d="M92 70H118" /><path className="link" d="M188 70H214" />
      <path className="link" d="M254 52C254 14 153 14 153 50" /><text className="lbl" x="204" y="22" textAnchor="middle">Convert to full-time</text>
      <text className="lbl" x="153" y="112" textAnchor="middle">Deployed and managed</text>
      </svg></div><div className="txt"><h3 className="h4">Augmentation / C2H</h3><p>Billable resources deployed and managed by Brynz, with the option to convert to full-time.</p><ul><li>Payroll and compliance handled</li><li>Convert when you're ready</li></ul></div></div>
          <div className="model"><div className="dia"><svg viewBox="0 0 300 140" role="img" aria-label="A Brynz team delivers milestones to you">
      <circle className="node brand" cx="30" cy="56" r="14" /><circle className="node brand" cx="56" cy="84" r="14" /><circle className="node brand" cx="24" cy="94" r="12" />
      <text className="lbl" x="40" y="128" textAnchor="middle">Brynz team</text>
      <path className="link" d="M74 72H118" />
      <path className="node" d="M134 56l14 14-14 14-14-14z" /><path className="node" d="M178 56l14 14-14 14-14-14z" /><path className="node brand" d="M222 56l14 14-14 14-14-14z" />
      <path className="link" d="M148 70H164M192 70H208" /><path className="link" d="M236 70H262" />
      <rect className="node" x="262" y="54" width="34" height="32" rx="8" /><text x="279" y="74" textAnchor="middle">You</text>
      <text className="lbl" x="178" y="112" textAnchor="middle">Milestones, owned by Brynz</text>
      </svg></div><div className="txt"><h3 className="h4">SOW</h3><p>Outcome-based delivery. Brynz owns execution and quality.</p><ul><li>Milestone-based billing</li><li>Delivery governance included</li></ul></div></div>
        </div>
      </section>

      <section className="section wrap pt0" id="process">
        <div className="section-head center"><h2 className="d2">Requisition to <em>deployment</em>.</h2><p className="lede">One requisition, start to finish. Your team only meets people worth meeting.</p></div>
        <div className="flow" data-flow data-dur="3.4">
        <ul className="flow-steps" role="tablist" aria-label="Stages"><li><button type="button" role="tab" id="eb0" aria-controls="es0" aria-selected="true"><span className="day">Day 0</span><b>Intake</b><span>JD, rate, start date</span><span className="bar"><i></i></span></button></li><li><button type="button" role="tab" id="eb1" aria-controls="es1" aria-selected="false"><span className="day">Day 1</span><b>Source</b><span>Database, portals, referrals</span><span className="bar"><i></i></span></button></li><li><button type="button" role="tab" id="eb2" aria-controls="es2" aria-selected="false"><span className="day">Day 2</span><b>Screen</b><span>Technical round and documentation</span><span className="bar"><i></i></span></button></li><li><button type="button" role="tab" id="eb3" aria-controls="es3" aria-selected="false"><span className="day">Day 3</span><b>Submit</b><span>Profiles with screening notes</span><span className="bar"><i></i></span></button></li><li><button type="button" role="tab" id="eb4" aria-controls="es4" aria-selected="false"><span className="day">On offer</span><b>Deploy</b><span>Onboarding and compliance</span><span className="bar"><i></i></span></button></li></ul>
        <div className="window"><div className="window-bar"><div className="dots"><i></i><i></i><i></i></div><div className="url">brynz.io/requisitions/sap-fico-x4</div></div><div className="stage"><div className="scene" id="es0" role="tabpanel" aria-labelledby="eb0"><div className="row a-in"><h4>New requisition</h4><span className="pill-n">Intake call, 20 min</span></div>
      <dl className="kv">
        <dt className="a-in" style={{ '--i': '1' } as React.CSSProperties}>Role</dt><dd className="a-in" style={{ '--i': '1' } as React.CSSProperties}>SAP S/4HANA FICO Consultant x4</dd>
        <dt className="a-in" style={{ '--i': '2' } as React.CSSProperties}>Model</dt><dd className="a-in" style={{ '--i': '2' } as React.CSSProperties}>Augmentation / C2H</dd>
        <dt className="a-in" style={{ '--i': '3' } as React.CSSProperties}>Experience</dt><dd className="a-in" style={{ '--i': '3' } as React.CSSProperties}>6 to 10 years, at least one S/4 migration</dd>
        <dt className="a-in" style={{ '--i': '4' } as React.CSSProperties}>Rate</dt><dd className="a-in" style={{ '--i': '4' } as React.CSSProperties}>Within client band</dd>
        <dt className="a-in" style={{ '--i': '5' } as React.CSSProperties}>Start</dt><dd className="a-in" style={{ '--i': '5' } as React.CSSProperties}>Client site, in 3 weeks</dd>
      </dl>
      <div className="a-in" style={{ '--i': '6' } as React.CSSProperties}><div className="chips"><span className="chip on">S/4HANA</span><span className="chip on">FICO</span><span className="chip on">Migration</span><span className="chip">Client-facing</span></div></div>
      <div className="row a-in" style={{ '--i': '7' } as React.CSSProperties}><span className="pill-ok">JD, rate and start date locked</span><span className="small">Next: sourcing starts today</span></div></div><div className="scene" id="es1" role="tabpanel" aria-labelledby="eb1" hidden><div className="row a-in"><div><div className="counter"><span data-count="114" data-repeat>114</span></div><div className="small">relevant profiles sourced in 24 hours</div></div><span className="pill-n">Niche skills mapped</span></div>
      <div className="chan a-in" style={{ '--i': '1' } as React.CSSProperties}><span>Brynz database</span><i className="a-grow" style={{ '--w': '100%', '--i': '1' } as React.CSSProperties}></i><b>64</b></div>
      <div className="chan a-in" style={{ '--i': '2' } as React.CSSProperties}><span>Job portals</span><i className="a-grow" style={{ '--w': '60%', '--i': '2' } as React.CSSProperties}></i><b>38</b></div>
      <div className="chan a-in" style={{ '--i': '3' } as React.CSSProperties}><span>Referrals</span><i className="a-grow" style={{ '--w': '20%', '--i': '3' } as React.CSSProperties}></i><b>12</b></div>
      <p className="small a-in" style={{ '--i': '4' } as React.CSSProperties}>Every profile is read against the JD before anyone calls it.</p></div><div className="scene" id="es2" role="tabpanel" aria-labelledby="eb2" hidden><div className="row a-in"><h4>Screening, consultant A.R.</h4><span className="pill-n">14 screened, 6 cleared</span></div>
      <div className="ck a-in" style={{ '--i': '1' } as React.CSSProperties}><span className="tk"></span><span>Technical round with a FICO lead</span></div><div className="ck a-in" style={{ '--i': '2' } as React.CSSProperties}><span className="tk"></span><span>S/4HANA migration project verified</span></div><div className="ck a-in" style={{ '--i': '3' } as React.CSSProperties}><span className="tk"></span><span>Documents and background checks started</span></div><div className="ck a-in" style={{ '--i': '4' } as React.CSSProperties}><span className="tk"></span><span>Notice period and rate confirmed</span></div>
      <div className="row a-in" style={{ '--i': '5' } as React.CSSProperties}><span className="pill-ok">Client-ready</span><span className="small">Screening notes attached</span></div></div><div className="scene" id="es3" role="tabpanel" aria-labelledby="eb3" hidden><div className="pcard a-in">
        <div className="top"><span className="av" style={{ background: '#3F3A8C' }}>AR</span><div><b>A.R., SAP FICO Consultant</b><span>8 yrs, 2 S/4 migrations, 30-day notice</span></div><span className="pill-ok">92% JD fit</span></div>
        <div className="notes"><b>Screening notes</b><p>Led GL and AP/AR design on a brownfield S/4 move. Strong on asset accounting. Comfortable client-facing. Rate inside band.</p></div>
      </div>
      <div className="row a-in" style={{ '--i': '2' } as React.CSSProperties}><span className="pill-n">6 profiles submitted</span><span className="pill-ok">4 shortlisted by client</span></div></div><div className="scene" id="es4" role="tabpanel" aria-labelledby="eb4" hidden><div className="offer a-in">
        <div className="stamp a-stamp">DEPLOYED<br />ON<br />TIME</div>
        <h4>Onboarding</h4>
        <div className="ck a-in" style={{ '--i': '1' } as React.CSSProperties}><span className="tk"></span><span>Offer accepted</span></div><div className="ck a-in" style={{ '--i': '2' } as React.CSSProperties}><span className="tk"></span><span>Onboarding documents complete</span></div><div className="ck a-in" style={{ '--i': '3' } as React.CSSProperties}><span className="tk"></span><span>Laptop and client access issued</span></div><div className="ck a-in" style={{ '--i': '4' } as React.CSSProperties}><span className="tk"></span><span>Day 1 at client site</span></div>
      </div>
      <div className="row a-in" style={{ '--i': '5' } as React.CSSProperties}><span className="pill-ok">4 of 4 positions filled</span><span className="small">One account manager throughout</span></div></div></div></div>
      </div>

      </section>

      <section className="section wrap pt0">
        <div className="section-head center"><h2 className="d2">Trusted by delivery and product <em>teams</em>.</h2><p className="lede">Global IT services firms, IT consulting firms and technology solution providers. Also hiring for YC-backed product teams in the US and India.</p></div>
        <div className="proof"><span>Global IT services</span><span>IT consulting</span><span>Government and enterprise solutions</span><span><span className="yc" aria-hidden="true">Y</span> YC-backed product teams</span></div>
      </section>

      <section className="section wrap pt0" id="talk" style={{ scrollMarginTop: '90px' }}>
        <div className="note">
          <div className="copy">
            <h2 className="d2">Share a <em>requirement</em>.</h2>
            <p className="lede">Tell us the role, the model and the timeline. An account manager comes back with a delivery plan.</p>
            <p className="sig-line">Every note is read by a Brynz partner, not a bot.</p>
          </div>
          <form className="note-form" data-form data-title="Enterprise requirement" noValidate>
            <div className="field"><label htmlFor="talk-email">Work email</label><input id="talk-email" name="talk-email" type="email" data-label="Work email" placeholder="you@company.com" required autoComplete="email" /><span className="err">Enter a valid email address.</span></div>
            <div className="field"><label htmlFor="talk-msg">What do you need?</label><textarea id="talk-msg" name="talk-msg" data-label="What do you need?" placeholder="4 x SAP S/4HANA FICO consultants, C2H, start in 3 weeks." required></textarea><span className="err">Tell us a little about what you need.</span></div>
            <div className="foot"><span className="fine">We reach out within one business day.</span><button className="btn btn-primary" type="submit">Send requirement</button></div>
          </form>
        </div>
      </section>
      <section className="section-tight"><div className="wrap">
        <div className="cta-band">
          <h2 className="d2">Let's build your teams together.</h2>
          <div className="acts">
            <p>Permanent, augmentation or SOW. One account manager from day one.</p>
            <div className="btns"><a className="btn btn-light" href="#talk">Talk to us</a><a className="btn btn-outline-light" href="https://cal.com/brynztech" target="_blank" rel="noopener">Book a call</a></div>
          </div>
        </div>
      </div></section>
    </main>
  )
}
