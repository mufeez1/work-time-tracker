/**
 * Generic shimmering placeholder shown while data loads.
 *
 * @param width   CSS width (number → px). Default "100%".
 * @param height  CSS height (number → px). Default 14.
 * @param radius  border radius (number → px). Default 6.
 * @param count   render N stacked bars (for multi-line placeholders).
 * @param gap     spacing between stacked bars (number → px).
 */
export default function Skeleton({
  width = "100%",
  height = 14,
  radius = 6,
  count = 1,
  gap = 8,
  className = "",
  style,
}) {
  const bar = (key) => (
    <span
      key={key}
      className={`skeleton ${className}`.trim()}
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );

  if (count === 1) return bar(0);

  return (
    <span className="skeleton-stack" style={{ gap }}>
      {Array.from({ length: count }, (_, i) => bar(i))}
    </span>
  );
}
