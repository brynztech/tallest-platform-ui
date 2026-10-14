import Link from 'next/link'

export function LockedJobsOverlay() {
  return (
    <div className="locked-overlay">
      <div className="note-form">
        <span className="pill-n">Find out which jobs are worth your time</span>
        <h3 className="d2" style={{ fontSize: '1.8rem' }}>
          Unlock your AI-ranked shortlist
        </h3>
        <p>
          Upload your resume and Brynz will reveal match strength, recruiter-ready profile signals, and the roles
          where you should move first.
        </p>
        <Link className="btn btn-primary" href="/signup?intent=resume_scan">
          Upload resume to reveal matches
        </Link>
      </div>
    </div>
  )
}
