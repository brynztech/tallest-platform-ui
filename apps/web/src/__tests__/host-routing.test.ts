import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { proxy } from '../../proxy'

function go(host: string, path: string) {
  const res = proxy(new NextRequest(`http://${host}${path}`, { headers: { host } }))
  return { status: res.status, to: res.headers.get('location') }
}

describe('one app, two hosts', () => {
  it('serves the homepage and company pages on trybrynz.com', () => {
    expect(go('trybrynz.com', '/').to).toBeNull()
    expect(go('trybrynz.com', '/startups').to).toBeNull()
  })

  it('sends talent pages from trybrynz.com to the talent host, keeping the query', () => {
    expect(go('trybrynz.com', '/jobs?q=python')).toEqual({ status: 307, to: 'https://talent.trybrynz.com/jobs?q=python' })
    expect(go('trybrynz.com', '/login').to).toBe('https://talent.trybrynz.com/login')
    expect(go('trybrynz.com', '/dashboard').to).toBe('https://talent.trybrynz.com/dashboard')
  })

  it('opens the talent host on jobs and sends company pages home', () => {
    expect(go('talent.trybrynz.com', '/').to).toBe('https://talent.trybrynz.com/jobs')
    expect(go('talent.trybrynz.com', '/jobs').to).toBeNull()
    expect(go('talent.trybrynz.com', '/signup').to).toBeNull()
    expect(go('talent.trybrynz.com', '/enterprises').to).toBe('https://trybrynz.com/enterprises')
  })

  it('sends www to the bare domain', () => {
    expect(go('www.trybrynz.com', '/startups')).toEqual({ status: 308, to: 'https://trybrynz.com/startups' })
  })

  it('leaves an IP or localhost alone so dev keeps every page', () => {
    expect(go('3.111.182.248', '/jobs').to).toBeNull()
    expect(go('localhost:3000', '/startups').to).toBeNull()
  })
})
