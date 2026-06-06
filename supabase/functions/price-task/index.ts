// Supabase Edge Function: price-task
// Calls Tongyi Qwen (DashScope, OpenAI-compatible endpoint) to price a task in
// virtual RMB. The DASHSCOPE_API_KEY lives as a Supabase secret — never in the
// frontend. Deploy:  supabase functions deploy price-task
//
// Request:  { "name": "Read a research paper" }
// Response: { "reward": 120, "source": "ai" }   (source = "ai" | "fallback")

const DASHSCOPE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
const MODEL = 'qwen-plus'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SYSTEM_PROMPT = `You price daily self-improvement tasks for a habit app that uses a virtual RMB economy.

Rules for the amount:
- The system charges the user ¥300 every day. A genuinely productive, serious full day should earn roughly ¥500 total across several tasks (so net about +¥200).
- Judge each task strictly by its real effort and value. Do NOT inflate rewards.
- Rough scale (guidance, not a rigid formula):
  - Trivial / small task (wash dishes, 20 flashcards): ¥20-40
  - Medium task / about 1 hour of study: ¥60-120
  - Hardcore task / intense focused hour (heavy workout, finishing a report): ¥120-200
- Output an integer between 5 and 300.

Reply with ONLY a JSON object, no prose: {"reward": <integer>}`

function clampReward(n: number): number {
  if (!Number.isFinite(n)) return 50
  return Math.min(300, Math.max(5, Math.round(n)))
}

function fallback(): Response {
  return new Response(JSON.stringify({ reward: 50, source: 'fallback' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const apiKey = Deno.env.get('DASHSCOPE_API_KEY')
  if (!apiKey) return fallback()

  let name = ''
  try {
    const body = await req.json()
    name = String(body?.name ?? '').slice(0, 200).trim()
  } catch {
    name = ''
  }
  if (!name) return fallback()

  try {
    const res = await fetch(DASHSCOPE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Task: ${name}` },
        ],
      }),
    })

    if (!res.ok) return fallback()
    const data = await res.json()
    const content: string = data?.choices?.[0]?.message?.content ?? ''

    // Be tolerant: accept {"reward": 80} or a bare number in the text.
    let reward: number | null = null
    const jsonMatch = content.match(/\{[^}]*\}/)
    if (jsonMatch) {
      try {
        reward = Number(JSON.parse(jsonMatch[0]).reward)
      } catch {
        reward = null
      }
    }
    if (reward === null || !Number.isFinite(reward)) {
      const numMatch = content.match(/\d+(\.\d+)?/)
      reward = numMatch ? Number(numMatch[0]) : NaN
    }

    return new Response(JSON.stringify({ reward: clampReward(reward), source: 'ai' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch {
    return fallback()
  }
})
