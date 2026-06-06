import { supabase } from './supabase'

const DEFAULT_REWARD = 50

/**
 * Ask the AI (via the `price-task` Edge Function) to price a task in virtual RMB.
 * Falls back to a default if the function isn't deployed or the AI is unavailable,
 * so the app keeps working either way.
 */
export async function priceTask(name: string): Promise<number> {
  try {
    const { data, error } = await supabase.functions.invoke('price-task', {
      body: { name },
    })
    if (error) throw error
    const reward = Number((data as { reward?: number })?.reward)
    return Number.isFinite(reward) ? reward : DEFAULT_REWARD
  } catch {
    return DEFAULT_REWARD
  }
}
