export interface Character {
  key: string
  name: string
  img: string
}

// Each user picks one. Add more as transparent PNGs land in /assets.
export const CHARACTERS: Character[] = [
  { key: 'hoodie', name: '小李', img: '/assets/char.png' },
  { key: 'afu', name: '阿福', img: '/assets/afu.png' },
  { key: 'deer', name: '小鹿', img: '/assets/deer.png' },
  { key: 'xiaoyu', name: '小雨', img: '/assets/XiaoYu.png' },
]

export const DEFAULT_CHARACTER = 'hoodie'

export function charImg(key?: string | null): string {
  return (CHARACTERS.find((c) => c.key === key) ?? CHARACTERS[0]).img
}
