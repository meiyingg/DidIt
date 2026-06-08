import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Lang = 'en' | 'zh'

type Dict = Record<string, string>

const en: Dict = {
  // nav
  'nav.home': 'Home',
  'nav.calendar': 'Calendar',
  'nav.shop': 'Shop',
  'nav.ranking': 'Ranking',
  'nav.profile': 'Profile',
  // common
  'common.save': 'Save',
  'common.saving': 'Saving…',
  'common.add': 'Add',
  'common.pricing': 'Pricing…',
  'common.signout': 'Sign out',
  'common.gotit': 'Got it!',
  'common.balance': 'Balance',
  'common.send': 'Send',
  'common.displayName': 'Display name',
  'common.loading': 'Loading…',
  'diary.title': "Today's journal",
  'diary.placeholder': "How was your day? What's on your mind?",
  'diary.unsaved': 'Unsaved changes',
  'diary.allSaved': 'All changes saved',
  // auth
  'auth.signin': 'Sign in',
  'auth.signup': 'Sign up',
  'auth.email': 'Email',
  'auth.password': 'Password (min 6 characters)',
  'auth.pickChar': 'Pick your character (permanent!)',
  'auth.created': 'Account created! If email confirmation is on, check your inbox — otherwise just sign in.',
  'auth.pleaseWait': 'Please wait…',
  'auth.createAccount': 'Create account',
  'auth.tagline': 'Earn your way out of the red.',
  'auth.error': 'Something went wrong',
  // sidebar
  'sidebar.dailyTip': 'Daily tip',
  // world
  'world.online': '{count} online',
  'world.welcome': 'Welcome, {name}!',
  'world.hintFocus': 'Tap <b>yourself</b> to start a focus timer',
  'world.hintPoke': 'Tap a <b>friend</b> to poke them',
  'world.hintWalk': 'Click the <b>ground</b> to walk around',
  'world.hintEmote': 'Use the <b>emotes</b> & chat to say hi',
  'world.sayRoom': 'Say something to the room…',
  'world.youPoked': 'You poked {name}',
  'world.pokedYou': '{name} poked you · 做了么?',
  'world.mute': 'Mute',
  'world.soundOn': 'Sound on',
  'world.startTimer': 'Start focus timer',
  'world.pokeName': 'Poke {name}',
  // status
  'status.allDone': 'all done',
  'status.idle': 'idle',
  // timer
  'timer.title': 'Focus Timer',
  'timer.pickTodo': 'Pick a to-do',
  'timer.orNew': 'Or type a new one',
  'timer.whatWorking': 'What are you working on?',
  'timer.placeholder': 'e.g. Math homework',
  'timer.start': 'Start',
  'timer.resume': 'Resume',
  'timer.pause': 'Pause',
  'timer.finish': 'Finish',
  'timer.aiReward': 'AI rewards you based on the task & time when you finish.',
  'timer.todoReward': 'Finishing completes this to-do & banks its reward.',
  'timer.niceWork': 'Nice work!',
  'timer.studiedEarned': 'You studied {time} and earned',
  // calendar
  'cal.dataPanel': 'Data panel',
  'cal.dailyRequired': 'Daily required',
  'cal.doneMonth': 'Done this month',
  'cal.totalTasks': 'Total tasks',
  'cal.pending': 'Still pending',
  'cal.noTodos': 'No to-dos for this day yet.',
  'cal.addQuest': 'Add a quest — AI sets the reward…',
  // task
  'task.required': 'Req',
  // fixed tasks
  'fixed.title': 'Daily required tasks',
  'fixed.desc': 'These appear automatically every day — your daily must-dos to stay in the black.',
  'fixed.empty': 'No required tasks yet — add your first below.',
  'fixed.placeholder': 'e.g. Exercise 30 min — AI prices it',
  // shop
  'shop.rewards': 'Rewards',
  'shop.title': 'Shop',
  'shop.spend': 'Spend your hard-earned coins — guilt-free.',
  'shop.buy': 'Buy',
  'shop.tooPricey': 'Too pricey',
  'shop.enjoy': 'Enjoy your {name}!',
  'shop.game': 'Play games',
  'shop.meal': 'Cheat meal',
  'shop.sleep': 'Sleep in',
  // ranking
  'rank.leaderboard': 'Leaderboard',
  'rank.studyChampions': 'Study Champions',
  'rank.hallWealth': 'Hall of Wealth',
  'rank.studyTime': 'Study time',
  'rank.wealth': 'Wealth',
  'rank.studyRanking': 'Study time ranking',
  'rank.wealthRanking': 'Wealth ranking',
  'rank.you': 'You',
  // wallet
  'wallet.money': 'Money',
  'wallet.title': 'Wallet',
  'wallet.earned': 'Earned',
  'wallet.spent': 'Spent',
  'wallet.transactions': 'Transactions',
  'wallet.empty': 'No transactions yet.',
  'wallet.viewLedger': 'View wallet ledger ›',
  'wallet.type.task_reward': 'Task reward',
  'wallet.type.study_reward': 'Study reward',
  'wallet.type.daily_deduction': 'Daily cost',
  'wallet.type.purchase': 'Purchase',
  'wallet.type.adjustment': 'Adjustment',
  // profile
  'profile.title': 'My Profile',
  'profile.playingAs': 'Playing as {name}',
  'profile.tasksDone': 'Tasks done',
  'profile.studyTime': 'Study time',
  'profile.sessions': 'Sessions',
  'profile.editProfile': 'Edit profile',
  'profile.bio': 'Bio',
  'profile.bioPlaceholder': 'A line about you…',
  'profile.saved': 'Saved ✓',
  'profile.charLocked': 'Your character is chosen at signup and can’t be changed.',
  'profile.namePlaceholder': 'Your name',
  // summary
  'summary.title': 'Good morning recap',
  'summary.thinking': 'Thinking about yesterday…',
  'summary.startDay': 'Start the day',
  'summary.fallback':
    'A fresh day begins. Yesterday is behind you — take one small step, keep your streak alive, and be kind to yourself. You’ve got this!',
}

const zh: Dict = {
  'nav.home': '首页',
  'nav.calendar': '日历',
  'nav.shop': '商店',
  'nav.ranking': '排行',
  'nav.profile': '我的',
  'common.save': '保存',
  'common.saving': '保存中…',
  'common.add': '添加',
  'common.pricing': '定价中…',
  'common.signout': '退出',
  'common.gotit': '知道了！',
  'common.balance': '余额',
  'common.send': '发送',
  'common.displayName': '昵称',
  'common.loading': '加载中…',
  'diary.title': '今日日记',
  'diary.placeholder': '今天过得怎么样？有什么想法？',
  'diary.unsaved': '有未保存的修改',
  'diary.allSaved': '已全部保存',
  'auth.signin': '登录',
  'auth.signup': '注册',
  'auth.email': '邮箱',
  'auth.password': '密码（至少 6 位）',
  'auth.pickChar': '选择角色（永久不可改！）',
  'auth.created': '注册成功！若开启了邮箱验证请查收邮件，否则直接登录即可。',
  'auth.pleaseWait': '请稍候…',
  'auth.createAccount': '创建账号',
  'auth.tagline': '努力赚钱，告别负债。',
  'auth.error': '出错了',
  'sidebar.dailyTip': '每日贴士',
  'world.online': '{count} 人在线',
  'world.welcome': '欢迎，{name}！',
  'world.hintFocus': '点击<b>自己</b>开始专注计时',
  'world.hintPoke': '点击<b>好友</b>戳一下',
  'world.hintWalk': '点击<b>地面</b>走动',
  'world.hintEmote': '用<b>表情</b>和聊天打招呼',
  'world.sayRoom': '对大家说点什么…',
  'world.youPoked': '你戳了 {name}',
  'world.pokedYou': '{name} 戳了你 · 做了么？',
  'world.mute': '静音',
  'world.soundOn': '开启声音',
  'world.startTimer': '开始专注计时',
  'world.pokeName': '戳 {name}',
  'status.allDone': '全部完成',
  'status.idle': '摸鱼中',
  'timer.title': '专注计时',
  'timer.pickTodo': '选择待办',
  'timer.orNew': '或新建一个',
  'timer.whatWorking': '在做什么？',
  'timer.placeholder': '例如：数学作业',
  'timer.start': '开始',
  'timer.resume': '继续',
  'timer.pause': '暂停',
  'timer.finish': '结束',
  'timer.aiReward': '结束时 AI 按任务和时长给你发奖励。',
  'timer.todoReward': '结束即完成该待办并发放奖励。',
  'timer.niceWork': '干得漂亮！',
  'timer.studiedEarned': '你学习了 {time}，获得',
  'cal.dataPanel': '数据面板',
  'cal.dailyRequired': '每日必做',
  'cal.doneMonth': '本月完成',
  'cal.totalTasks': '总任务',
  'cal.pending': '待完成',
  'cal.noTodos': '这天还没有待办。',
  'cal.addQuest': '添加任务 — AI 自动定价…',
  'task.required': '必做',
  'fixed.title': '每日必做事项',
  'fixed.desc': '每天自动出现——你的每日必做，维持正向收支。',
  'fixed.empty': '还没有必做事项——下面添加第一个吧。',
  'fixed.placeholder': '例如：运动 30 分钟 — AI 定价',
  'shop.rewards': '奖励',
  'shop.title': '商店',
  'shop.spend': '花掉你辛苦赚来的金币——无愧疚。',
  'shop.buy': '购买',
  'shop.tooPricey': '买不起',
  'shop.enjoy': '享受你的{name}！',
  'shop.game': '玩游戏',
  'shop.meal': '欺骗餐',
  'shop.sleep': '睡懒觉',
  'rank.leaderboard': '排行榜',
  'rank.studyChampions': '学习冠军',
  'rank.hallWealth': '财富殿堂',
  'rank.studyTime': '学习时长',
  'rank.wealth': '财富',
  'rank.studyRanking': '学习时长榜',
  'rank.wealthRanking': '财富榜',
  'rank.you': '你',
  'wallet.money': '资金',
  'wallet.title': '钱包',
  'wallet.earned': '收入',
  'wallet.spent': '支出',
  'wallet.transactions': '交易记录',
  'wallet.empty': '还没有交易。',
  'wallet.viewLedger': '查看钱包流水 ›',
  'wallet.type.task_reward': '任务奖励',
  'wallet.type.study_reward': '学习奖励',
  'wallet.type.daily_deduction': '每日扣款',
  'wallet.type.purchase': '购买',
  'wallet.type.adjustment': '调整',
  'profile.title': '我的主页',
  'profile.playingAs': '角色：{name}',
  'profile.tasksDone': '完成任务',
  'profile.studyTime': '学习时长',
  'profile.sessions': '学习次数',
  'profile.editProfile': '编辑资料',
  'profile.bio': '简介',
  'profile.bioPlaceholder': '介绍一下自己…',
  'profile.saved': '已保存 ✓',
  'profile.charLocked': '角色在注册时选定，之后无法更改。',
  'profile.namePlaceholder': '你的名字',
  'summary.title': '早安回顾',
  'summary.thinking': '正在回顾昨天…',
  'summary.startDay': '开启新的一天',
  'summary.fallback': '新的一天开始了。昨天已经过去——迈出一小步，保持连击，对自己好一点。你可以的！',
}

const DICTS: Record<Lang, Dict> = { en, zh }

interface LangState {
  lang: Lang
  locale: string
  setLang: (l: Lang) => void
  toggle: () => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const LangContext = createContext<LangState | undefined>(undefined)

function detectInitial(): Lang {
  const saved = typeof window !== 'undefined' ? localStorage.getItem('didit_lang') : null
  if (saved === 'en' || saved === 'zh') return saved
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('zh')) return 'zh'
  return 'en'
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectInitial)

  useEffect(() => {
    localStorage.setItem('didit_lang', lang)
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
  }, [lang])

  const setLang = (l: Lang) => setLangState(l)
  const toggle = () => setLangState((l) => (l === 'en' ? 'zh' : 'en'))

  function t(key: string, vars?: Record<string, string | number>) {
    let s = DICTS[lang][key] ?? DICTS.en[key] ?? key
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v))
    return s
  }

  return (
    <LangContext.Provider value={{ lang, locale: lang === 'zh' ? 'zh-CN' : 'en-US', setLang, toggle, t }}>
      {children}
    </LangContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used within LangProvider')
  return ctx
}
