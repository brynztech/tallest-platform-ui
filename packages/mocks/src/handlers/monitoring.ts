import { http, HttpResponse } from 'msw'
import type { HttpHandler } from 'msw'
import type { components } from '@brynzit/api-client'
import { API_BASE } from '../base-url'

// Monitoring domain MSW handlers.
// 6 handlers covering cost, agent-events, quota, pipeline, and prompts.
export const monitoringHandlers: HttpHandler[] = [

  // 1. GET /api/v1/monitoring/cost — cost breakdown by period
  http.get(`${API_BASE}/api/v1/monitoring/cost`, ({ request }) => {
    const url = new URL(request.url)
    const period = url.searchParams.get('period') ?? 'month'
    const now = new Date()
    const start = period === 'day'
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      : period === 'week'
        ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    return HttpResponse.json({
      period,
      start,
      end: now.toISOString(),
      rows: [
        {
          domain: 'bd',
          model_used: 'gpt-4o',
          task_type: 'icp_scoring',
          total_usd: 12.48,
          call_count: 156,
        },
        {
          domain: 'supply',
          model_used: 'gpt-4o',
          task_type: 'engagement_generate',
          total_usd: 8.32,
          call_count: 52,
        },
        {
          domain: 'ops',
          model_used: 'gpt-4o-mini',
          task_type: 'jd_parse',
          total_usd: 1.24,
          call_count: 31,
        },
      ],
    } satisfies components['schemas']['CostResponse'])
  }),

  // 2. GET /api/v1/monitoring/agent-events — filterable agent event feed (newest-first)
  http.get(`${API_BASE}/api/v1/monitoring/agent-events`, ({ request }) => {
    const url = new URL(request.url)
    const domain = url.searchParams.get('domain')
    const status = url.searchParams.get('status')
    const limit = Number(url.searchParams.get('limit') ?? 10)
    const offset = Number(url.searchParams.get('offset') ?? 0)

    const allEvents: components['schemas']['AgentEventOut'][] = [
      {
        id: '00000000-0000-0000-0000-evt000000001',
        domain: 'bd',
        agent_type: 'icp_scorer',
        task_type: 'icp_scoring',
        model_used: 'gpt-4o',
        input_tokens: 1200,
        output_tokens: 300,
        cost_usd: 0.09,
        duration_ms: 1842,
        status: 'success',
        created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      },
      {
        id: '00000000-0000-0000-0000-evt000000002',
        domain: 'bd',
        agent_type: 'outreach_generator',
        task_type: 'outreach_generate',
        model_used: 'gpt-4o',
        input_tokens: 2400,
        output_tokens: 800,
        cost_usd: 0.22,
        duration_ms: 3201,
        status: 'success',
        created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      },
      {
        id: '00000000-0000-0000-0000-evt000000003',
        domain: 'supply',
        agent_type: 'engagement_generator',
        task_type: 'engagement_generate',
        model_used: 'gpt-4o',
        input_tokens: 1800,
        output_tokens: 600,
        cost_usd: 0.17,
        duration_ms: 2140,
        status: 'success',
        created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      },
      {
        id: '00000000-0000-0000-0000-evt000000004',
        domain: 'bd',
        agent_type: 'icp_scorer',
        task_type: 'icp_scoring',
        model_used: 'gpt-4o',
        input_tokens: 1100,
        output_tokens: 280,
        cost_usd: 0.08,
        duration_ms: 1650,
        status: 'quota_exhausted',
        created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      },
      {
        id: '00000000-0000-0000-0000-evt000000005',
        domain: 'ops',
        agent_type: 'jd_parser',
        task_type: 'jd_parse',
        model_used: 'gpt-4o-mini',
        input_tokens: 3200,
        output_tokens: 400,
        cost_usd: 0.04,
        duration_ms: 1120,
        status: 'success',
        created_at: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
      },
      {
        id: '00000000-0000-0000-0000-evt000000006',
        domain: 'supply',
        agent_type: 'enrichment_agent',
        task_type: 'enrich',
        model_used: 'gpt-4o-mini',
        input_tokens: 900,
        output_tokens: 200,
        cost_usd: 0.02,
        duration_ms: 890,
        status: 'success',
        created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      },
      {
        id: '00000000-0000-0000-0000-evt000000007',
        domain: 'bd',
        agent_type: 'outreach_generator',
        task_type: 'outreach_generate',
        model_used: 'gpt-4o',
        input_tokens: 2200,
        output_tokens: 750,
        cost_usd: 0.19,
        duration_ms: 2980,
        status: 'failed',
        created_at: new Date(Date.now() - 1000 * 60 * 72).toISOString(),
      },
      {
        id: '00000000-0000-0000-0000-evt000000008',
        domain: 'bd',
        agent_type: 'icp_scorer',
        task_type: 'icp_scoring',
        model_used: 'gpt-4o',
        input_tokens: 1050,
        output_tokens: 260,
        cost_usd: 0.08,
        duration_ms: 1490,
        status: 'success',
        created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      },
      {
        id: '00000000-0000-0000-0000-evt000000009',
        domain: 'supply',
        agent_type: 'engagement_generator',
        task_type: 'engagement_generate',
        model_used: 'gpt-4o',
        input_tokens: 1950,
        output_tokens: 620,
        cost_usd: 0.18,
        duration_ms: 2300,
        status: 'success',
        created_at: new Date(Date.now() - 1000 * 60 * 105).toISOString(),
      },
      {
        id: '00000000-0000-0000-0000-evt000000010',
        domain: 'ops',
        agent_type: 'matching_agent',
        task_type: 'candidate_matching',
        model_used: 'gpt-4o',
        input_tokens: 4100,
        output_tokens: 900,
        cost_usd: 0.31,
        duration_ms: 4210,
        status: 'success',
        created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      },
    ]

    let filtered = allEvents
    if (domain) filtered = filtered.filter((e) => e.domain === domain)
    if (status) filtered = filtered.filter((e) => e.status === status)
    // NOTE: task_type filter is intentionally NOT applied here — client filters client-side (D-15)
    const paginated = filtered.slice(offset, offset + limit)
    return HttpResponse.json(paginated)
  }),

  // 3. GET /api/v1/monitoring/quota — current token quota status
  http.get(`${API_BASE}/api/v1/monitoring/quota`, () => {
    return HttpResponse.json({
      model: 'gpt-4o',
      used_tokens: 48000,
      cap_tokens: 100000,
      percent: 48,
      warning: false,
    } satisfies components['schemas']['QuotaResponse'])
  }),

  // 4. GET /api/v1/monitoring/pipeline — lead + sequence status counts
  http.get(`${API_BASE}/api/v1/monitoring/pipeline`, () => {
    return HttpResponse.json({
      lead_counts: {
        discovered: 24,
        icp_scored: 18,
        review_queue: 7,
        approved: 5,
        outreach_sent: 12,
        replied: 3,
        converted: 2,
      },
      sequence_counts: {
        draft: 8,
        approved: 5,
        sent: 12,
        replied: 3,
        rejected: 2,
      },
      failed_agent_events_24h: 2,
    } satisfies components['schemas']['platform__monitoring_router__PipelineResponse'])
  }),

  // 5. GET /api/v1/monitoring/prompts/:name — get prompt content
  http.get(`${API_BASE}/api/v1/monitoring/prompts/:name`, ({ params }) => {
    const name = params.name as string
    return HttpResponse.json({
      name,
      content: `You are an AI agent for task: ${name}.\n\nSystem prompt here.\n\nBe concise and accurate in your responses. Follow the output format specified in the user message.`,
      versions: ['v1'],
    } satisfies components['schemas']['PromptContentResponse'])
  }),

  // 6. PUT /api/v1/monitoring/prompts/:name — save/update prompt content
  http.put(`${API_BASE}/api/v1/monitoring/prompts/:name`, async ({ params, request }) => {
    const name = params.name as string
    const body = await request.json() as components['schemas']['PromptSaveRequest']
    return HttpResponse.json({
      name,
      version_saved: 2,
      message: `Prompt "${name}" saved successfully.`,
    } satisfies components['schemas']['PromptSaveResponse'])
  }),

]
