type Props = {
  /** Delay (in ms) so adjacent bulbs don't blink in sync. */
  delay?: number;
  size?: number;
};

export function NeonBulb({ delay = 0, size = 10 }: Props) {
  return (
    <span
      aria-hidden
      className="animate-bulb inline-block rounded-full bg-[--color-gold-300]"
      style={{
        width: size,
        height: size,
        animationDelay: `${delay}ms`,
      }}
    />
  );
}
