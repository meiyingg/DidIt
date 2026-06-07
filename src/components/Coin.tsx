/** The pixel coin icon. Use anywhere a ¥ amount is shown. */
export default function Coin({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <img
      src="/assets/coin.png"
      alt="¥"
      draggable={false}
      className={`inline-block shrink-0 align-[-0.15em] ${className}`}
    />
  )
}
