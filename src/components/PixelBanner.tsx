interface Props {
  name: string
  doneAll: boolean
}

/** A cozy Stardew-ish pixel landscape header: sky, clouds, rolling hills, houses. */
export default function PixelBanner({ name, doneAll }: Props) {
  const hour = new Date().getHours()
  const greeting = hour < 11 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="relative h-40 overflow-hidden rounded-2xl border-[1.5px] border-[color:var(--color-line)] shadow-[0_2px_0_0_var(--color-line),0_6px_14px_-8px_rgba(67,56,31,0.25)] sm:h-44">
      {/* sky */}
      <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--color-sky-1)] to-[color:var(--color-sky-2)]" />

      {/* sun */}
      <div className="absolute right-8 top-6 h-12 w-12 rounded-full bg-amber-200 shadow-[0_0_30px_10px_rgba(254,240,138,0.7)]" />

      {/* clouds (blocky) */}
      <div className="absolute left-10 top-7 h-3 w-16 rounded-full bg-white/85" />
      <div className="absolute left-16 top-4 h-3 w-10 rounded-full bg-white/85" />
      <div className="absolute right-28 top-12 h-2.5 w-12 rounded-full bg-white/70" />

      {/* far hill */}
      <div className="absolute -bottom-10 left-0 right-0 h-24 rounded-[100%] bg-[#8fc857]" />
      {/* near hill */}
      <div className="absolute -bottom-8 -left-8 -right-8 h-20 rounded-[100%] bg-[color:var(--color-grass)] shadow-[inset_0_3px_0_rgba(255,255,255,0.25)]" />

      {/* scenery on the hill */}
      <div className="absolute bottom-3 left-6 text-2xl drop-shadow-sm">🌳</div>
      <div className="absolute bottom-2 left-20 text-3xl drop-shadow-sm">🏡</div>
      <div className="absolute bottom-3 left-36 text-xl drop-shadow-sm">🌳</div>
      <div className="absolute bottom-2 right-10 text-2xl drop-shadow-sm">🌲</div>
      <div className="absolute bottom-3 right-24 text-lg drop-shadow-sm">🌻</div>

      {/* farmer */}
      <div className="animate-float absolute bottom-3 right-40 text-3xl drop-shadow">🧑‍🌾</div>

      {/* greeting */}
      <div className="absolute left-5 top-5">
        <p className="font-pixel text-lg font-bold text-[#2c4a63] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)] sm:text-xl">
          {greeting}, {name}!
        </p>
        <p className="mt-1 text-sm font-medium text-[#37576f]">
          {doneAll ? 'All required tasks done — enjoy your day! 🎉' : "Let's earn our keep today."}
        </p>
      </div>
    </div>
  )
}
