/** A pixel icon image from /assets. Pass the filename without extension. */
export default function Icon({ src, className = 'h-5 w-5' }: { src: string; className?: string }) {
  return (
    <img
      src={`/assets/${src}.png`}
      alt=""
      draggable={false}
      className={`inline-block shrink-0 object-contain align-[-0.18em] ${className}`}
    />
  )
}
