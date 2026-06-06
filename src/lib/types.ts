export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  balance: number
  vouchers: number
  created_at: string
}

export type TaskType = 'required' | 'custom'

export interface Task {
  id: string
  user_id: string
  name: string
  type: TaskType
  task_date: string
  reward: number
  done: boolean
  completed_at: string | null
  source_fixed_id: string | null
  created_at: string
}

export interface FixedTask {
  id: string
  user_id: string
  name: string
  reward: number
  sort_order: number
  created_at: string
}

export type WalletLogType = 'task_reward' | 'study_reward' | 'daily_deduction'

export interface WalletLog {
  id: string
  user_id: string
  amount: number
  type: WalletLogType
  note: string | null
  created_at: string
}
