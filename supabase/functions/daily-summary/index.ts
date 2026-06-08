// Supabase Edge Function: daily-summary
// Calls Tongyi Qwen (DashScope, OpenAI-compatible endpoint) to write a warm,
// "good morning" recap of the user's YESTERDAY (journal + task stats). The
// DASHSCOPE_API_KEY lives as a Supabase secret — never in the frontend.
// Deploy:  supabase functions deploy daily-summary
//
// Request:  { "diary": "...", "tasksDone": 3, "tasksTotal": 5, "date": "2026-06-06" }
// Response: { "summary": "..." }

const DASHSCOPE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
const MODEL = 'qwen-plus'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function systemPrompt(lang: string): string {
  const replyIn =
    lang === 'zh' ? 'Reply in Simplified Chinese (中文), plain text only.' : 'Reply in English, plain text only.'
  return `You are a warm, encouraging daily companion in a self-discipline app. Given a user's journal text and task stats from YESTERDAY, reply with a SHORT (2-3 sentences) friendly recap that acknowledges what they did and how they felt, then one uplifting line of encouragement for today. Be warm, specific, and human — not generic. ${replyIn}`
}

const FALLBACK = {
  en: "A fresh day begins. Yesterday is behind you — take one small step, keep your streak alive, and be kind to yourself. You've got this!",
  zh: '新的一天开始了。昨天已经过去——迈出一小步，保持连击，对自己好一点。你可以的！',
}

function fallback(lang: string): Response {
  return new Response(JSON.stringify({ summary: lang === 'zh' ? FALLBACK.zh : FALLBACK.en }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let diary = ''
  let tasksDone = 0
  let tasksTotal = 0
  let date = ''
  let lang = 'en'
  try {
    const body = await req.json()
    diary = String(body?.diary ?? '').slice(0, 4000).trim()
    tasksDone = Number(body?.tasksDone ?? 0)
    tasksTotal = Number(body?.tasksTotal ?? 0)
    date = String(body?.date ?? '').slice(0, 40).trim()
    lang = body?.lang === 'zh' ? 'zh' : 'en'
    if (!Number.isFinite(tasksDone)) tasksDone = 0
    if (!Number.isFinite(tasksTotal)) tasksTotal = 0
  } catch {
    diary = ''
  }

  const apiKey = Deno.env.get('DASHSCOPE_API_KEY')
  if (!apiKey) return fallback(lang)

  const userMessage =
    `Yesterday was ${date || 'the previous day'}.\n` +
    `Tasks completed: ${tasksDone} out of ${tasksTotal}.\n` +
    `Journal: ${diary ? diary : '(no journal was written)'}`

  try {
    const res = await fetch(DASHSCOPE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.7,
        messages: [
          { role: 'system', content: systemPrompt(lang) },
          { role: 'user', content: userMessage },
        ],
      }),
    })

    if (!res.ok) return fallback(lang)
    const data = await res.json()
    const content: string = (data?.choices?.[0]?.message?.content ?? '').trim()
    if (!content) return fallback(lang)

    return new Response(JSON.stringify({ summary: content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch {
    return fallback(lang)
  }
})
